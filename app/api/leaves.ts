import { supabase } from '@/lib/supabase'
import type { Leave } from '@/lib/database.types'
import { getProfile } from './profile'
import dayjs from 'dayjs'

/** Request a new leave (Employee) */
export async function requestLeave(leaveData: Omit<Leave, 'id' | 'created_at' | 'status'>) {
  // 1. Validation for ALL leave types
  const { data: profile } = await getProfile(leaveData.employee_id)
  if (profile?.employee) {
    const duration = dayjs(leaveData.end_date).diff(dayjs(leaveData.start_date), 'day') + 1
    const currentBalance = profile.employee.vacation_balance ?? 0

    if (duration > currentBalance) {
      return { data: null, error: { message: `Insufficient Balance. You have ${currentBalance} days remaining, but requested ${duration} days.` } }
    }
  }

  const { data, error } = await (supabase as any)
    .from('leaves')
    .insert([leaveData])
    .select()

  if (!error && data?.[0]) {

    // @ts-ignore - La fonction existe en DB mais l'éditeur met du temps à se mettre à jour
    await supabase.rpc('create_admin_notification', {
      p_title: 'Nouvelle demande de congé',
      p_message: `${profile?.user_name || 'Un employé'} a demandé un congé du ${dayjs(leaveData.start_date).format('DD/MM/YYYY')} au ${dayjs(leaveData.end_date).format('DD/MM/YYYY')}.`
    })
  }

  return { data: data?.[0] as Leave | null | undefined, error }
}

/** Get leaves for a specific user (Employee) */
export async function getMyLeaves(employeeId: string, params?: {
  page: number,
  pageSize: number,
  search?: string,
  status?: string | string[],
  leaveType?: string | string[],
  startDate?: string,
  endDate?: string,
  sortOrder?: 'ascend' | 'descend'
}) {
  // Sync balance first to ensure accuracy
  await syncVacationBalance(employeeId)

  let query = supabase
    .from('leaves')
    .select('*', { count: 'exact' })
    .eq('employee_id', employeeId);

  if (params?.search) {
    query = query.ilike('reason', `%${params.search}%`);
  }

  if (params?.startDate) {
    query = query.gte('start_date', params.startDate);
  }

  if (params?.endDate) {
    query = query.lte('start_date', params.endDate);
  }

  if (params?.status) {
    if (Array.isArray(params.status)) {
      if (params.status.length > 0) {
        query = query.in('status', params.status.map(s => s.toLowerCase()));
      }
    } else if (params.status !== 'All Status') {
      query = query.eq('status', params.status.toLowerCase());
    }
  }

  if (params?.leaveType) {
    if (Array.isArray(params.leaveType)) {
      if (params.leaveType.length > 0) {
        query = query.in('type', params.leaveType);
      }
    } else if (params.leaveType !== 'All Types') {
      query = query.eq('type', params.leaveType);
    }
  }

  if (params) {
    const { page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const sortAscending = params?.sortOrder === 'ascend';

  const { data, error, count } = await query
    .order('created_at', { ascending: sortAscending })

  return { data: data as Leave[], count: count || 0, error }
}

/** Get all leaves with user details (Admin) - Server Side Pagination & Filters */
export async function getAllLeavesDetailed(params: {
  page: number;
  pageSize: number;
  showArchived?: boolean;
  status?: string | string[];
  search?: string;
  leaveType?: string | string[];
  startDate?: string;
  endDate?: string;
}) {
  const {
    page,
    pageSize,
    showArchived = false,
    status,
    search,
    leaveType,
    startDate,
    endDate
  } = params;

  let query = supabase
    .from('v_leaves_activities')
    .select('*', { count: 'exact' })
    .eq('is_archived', showArchived);

  // Filter by Status
  if (status && status !== 'All Status') {
    if (Array.isArray(status) && status.length > 0) {
      query = query.in('status', status.map(s => s.toLowerCase()));
    } else if (typeof status === 'string') {
      query = query.eq('status', status.toLowerCase());
    }
  }

  // Filter by Search (Name or Type)
  if (search) {
    query = query.or(`type.ilike.%${search}%,user_name.ilike.%${search}%`);
  }

  // Filter by Leave Type
  if (leaveType && leaveType !== 'All Types') {
    if (Array.isArray(leaveType) && leaveType.length > 0) {
      query = query.in('type', leaveType);
    } else if (typeof leaveType === 'string') {
      query = query.eq('type', leaveType);
    }
  }

  // Filter by Date Range (start_date)
  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('start_date', endDate);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  return {
    data: (data || []).map((item: any) => ({
      ...item,
      employee: {
        id: item.employee_id,
        department: item.department,
        position: item.position,
        user: {
          user_name: item.user_name,
          avatar_url: item.avatar_url
        }
      }
    })),
    count: count || 0,
    error
  };
}

export async function archiveLeaves(ids: string[]) {
  const { data, error } = await (supabase as any)
    .from('leaves')
    .update({ is_archived: true })
    .in('id', ids)
    .select()
  return { data, error }
}

export async function deleteLeavesPermanently(ids: string[]) {
  const { data, error } = await (supabase as any)
    .from('leaves')
    .delete()
    .in('id', ids)
  return { data, error }
}

export async function unarchiveLeaves(ids: string[]) {
  const { data, error } = await (supabase as any)
    .from('leaves')
    .update({ is_archived: false })
    .in('id', ids)
    .select()
  return { data, error }
}

/** Update leave status (Admin) */
export async function updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
  // Fetch leave to get employee_id for notification and duration
  const { data: leave } = await supabase.from('leaves').select('*').eq('id', leaveId).single()

  if (!leave) return { data: null, error: { message: "Leave not found" } }

  const updatePayload: any = { status }
  if (status === 'rejected' && rejectionReason) {
    updatePayload.rejection_reason = rejectionReason
  } else if (status === 'approved') {
    updatePayload.rejection_reason = null
  }

  const { data, error } = await (supabase as any)
    .from('leaves')
    .update(updatePayload)
    .eq('id', leaveId)
    .select()

  // Sync balance if approved
  if (!error && status === 'approved') {
    await syncVacationBalance((leave as any).employee_id)
  }

  // Insert real-time notification
  if (!error && leave) {
    const l = leave as any
    const title = status === 'approved' ? 'Congé approuvé' : 'Congé refusé'
    let message = status === 'approved'
      ? `Votre demande de congé du ${l.start_date} au ${l.end_date} a été validée.`
      : `Votre demande de congé du ${l.start_date} au ${l.end_date} a été refusée.`

    if (status === 'rejected' && rejectionReason) {
      message += ` Motif : ${rejectionReason}`
    }

    await supabase.from('notifications' as any).insert([{
      user_id: l.employee_id,
      title,
      message,
      is_read: false
    }] as any)
  }

  return { data: (data as any)?.[0] as Leave | null | undefined, error }
}

/** Adjust an employee's leave balance manually (Admin) */
export async function adjustEmployeeBalance(employeeId: string, adjustment: number) {
  // 1. Get current balance
  const { data: employee, error: fetchError } = await supabase
    .from('employee')
    .select('vacation_balance')
    .eq('id', employeeId)
    .single()

  if (fetchError || !employee) return { data: null, error: fetchError }

  // 2. Update balance
  const newBalance = (Number((employee as any).vacation_balance) || 0) + adjustment
  const { data, error } = await (supabase as any)
    .from('employee')
    .update({ vacation_balance: newBalance })
    .eq('id', employeeId)
    .select()

  return { data, error }
}

// ─── Minimum staffing thresholds per department ──────────
const DEPT_MIN_STAFF: Record<string, number> = {
  'IT': 2,
  'Informatique': 2,
  'HR': 1,
  'Ressources Humaines': 1,
  'Finance': 1,
  'Marketing': 1,
  'Commercial': 1,
  'Direction': 1,
  'default': 1,
}

/** Get department availability context for a leave request */
export async function getDepartmentAvailability(employeeId: string, startDate: string, endDate: string) {
  // 1. Get the employee's department
  const { data: emp } = await supabase
    .from('employee')
    .select('department')
    .eq('id', employeeId)
    .single()

  const department = (emp as any)?.department || 'Other'

  // 2. Count total employees in this department
  const { count: totalInDept } = await supabase
    .from('employee')
    .select('*', { count: 'exact', head: true })
    .eq('department', department)

  // 3. Count employees already on approved leave during the requested period

  const { data: overlappingLeaves } = await supabase
    .from('leaves')
    .select('employee_id')
    .eq('status', 'approved')
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  // Deduplicate employee IDs (one employee might have multiple approved leaves)
  const uniqueAbsentIds = new Set(((overlappingLeaves as any[]) ?? []).map(l => l.employee_id))
  const absentCount = uniqueAbsentIds.size

  // 4. Get the employee's leave balance
  const { data: profile } = await getProfile(employeeId)
  const balance = profile?.employee?.vacation_balance ?? 0

  // 5. Get the employee's last 3 leaves
  const { data: recentLeaves } = await supabase
    .from('leaves')
    .select('type, start_date, end_date, status')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(3)

  const total = totalInDept ?? 0
  const availableAfter = total - absentCount - 1 // -1 for the requesting employee
  const minStaff = DEPT_MIN_STAFF[department] ?? DEPT_MIN_STAFF['default']
  const belowThreshold = availableAfter < minStaff

  return {
    department,
    totalInDept: total,
    absentCount,
    availableAfter,
    minStaff,
    belowThreshold,
    balance,
    recentLeaves: recentLeaves ?? [],
  }
}

/** 
 * Automatically calculate and sync the vacation balance based on hire_date and monthly_rate.
 * Logic: (Full months since hire_date * monthly_rate) - (Sum of approved leaves days)
 */
export async function syncVacationBalance(employeeId: string) {
  // 1. Get employee details
  const { data: emp, error: empError } = await supabase
    .from('employee')
    .select('hire_date, monthly_rate, vacation_balance')
    .eq('id', employeeId)
    .single()

  if (empError || !emp || !(emp as any).hire_date) return { error: empError || new Error('Employee not found or no hire date') }

  const hireDate = dayjs((emp as any).hire_date)
  const now = dayjs()

  if (now.isBefore(hireDate)) {
    // Hasn't started yet
    await (supabase as any).from('employee').update({ vacation_balance: 0 }).eq('id', employeeId)
    return { balance: 0 }
  }

  // 2. Calculate accrued days (Full months only)
  const fullMonths = now.diff(hireDate, 'month')
  const totalAccrued = fullMonths * ((emp as any).monthly_rate || 0)

  // 3. Subtract all approved leaves
  const { data: approvedLeaves } = await supabase
    .from('leaves')
    .select('start_date, end_date')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')

  const usedDays = ((approvedLeaves as any[]) ?? []).reduce((acc, leave) => {
    const days = dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1
    return acc + days
  }, 0)

  const finalBalance = Math.max(0, totalAccrued - usedDays)

  // 4. Update DB if changed
  if (finalBalance !== (emp as any).vacation_balance) {
    await (supabase as any)
      .from('employee')
      .update({ vacation_balance: finalBalance })
      .eq('id', employeeId)
  }

  return { balance: finalBalance }
}
