import { supabase } from './supabase'
import type { Conge } from './database.types'
import { getProfile } from './profile'
import dayjs from 'dayjs'

/** Request a new leave (Employee) */
export async function requestLeave(leaveData: Omit<Conge, 'id' | 'created_at' | 'status'>) {
  // 1. Validation for ALL leave types
  const { data: profile } = await getProfile(leaveData.employee_id)
  if (profile?.employee) {
    const duration = dayjs(leaveData.end_date).diff(dayjs(leaveData.start_date), 'day') + 1
    const currentBalance = profile.employee.vacation_balance ?? 0

    if (duration > currentBalance) {
      return { data: null, error: { message: `Insufficient Balance. You have ${currentBalance} days remaining, but requested ${duration} days.` } }
    }
  }

  const { data, error } = await supabase
    .from('conges')
    .insert([leaveData])
    .select()

  if (!error && data?.[0]) {

    // @ts-ignore - La fonction existe en DB mais l'éditeur met du temps à se mettre à jour
    await supabase.rpc('create_admin_notification', {
      p_title: 'Nouvelle demande de congé',
      p_message: `${profile?.user_name || 'Un employé'} a demandé un congé du ${dayjs(leaveData.start_date).format('DD/MM/YYYY')} au ${dayjs(leaveData.end_date).format('DD/MM/YYYY')}.`
    })
  }

  return { data: data?.[0] as Conge | null | undefined, error }
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
  let query = supabase
    .from('conges')
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

  return { data: data as Conge[], count: count || 0, error }
}

/** Get all leaves with user details (Admin) - Server Side Pagination & Filters */
export async function getAllLeavesDetailed(params: {
  page: number;
  pageSize: number;
  showArchived?: boolean;
  status?: string;
  search?: string;
  leaveType?: string;
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
    query = query.eq('status', status.toLowerCase());
  }

  // Filter by Search (Name or Type)
  if (search) {
    query = query.or(`type.ilike.%${search}%,user_name.ilike.%${search}%`);
  }

  // Filter by Leave Type
  if (leaveType && leaveType !== 'All Types') {
    query = query.eq('type', leaveType);
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
    data: (data || []).map(item => ({
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
  const { data, error } = await supabase
    .from('conges')
    .update({ is_archived: true })
    .in('id', ids)
    .select()
  return { data, error }
}

export async function deleteLeavesPermanently(ids: string[]) {
  const { data, error } = await supabase
    .from('conges')
    .delete()
    .in('id', ids)
  return { data, error }
}

export async function unarchiveLeaves(ids: string[]) {
  const { data, error } = await supabase
    .from('conges')
    .update({ is_archived: false })
    .in('id', ids)
    .select()
  return { data, error }
}

/** Update leave status (Admin) */
export async function updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
  // Fetch leave to get employee_id for notification and duration
  const { data: leave } = await supabase.from('conges').select('*').eq('id', leaveId).single()

  if (!leave) return { data: null, error: { message: "Leave not found" } }

  // If approving any leave, deduct from balance
  if (status === 'approved') {
    const duration = dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1
    const { data: profile } = await getProfile(leave.employee_id)

    if (profile?.employee) {
      const newBalance = (profile.employee.vacation_balance ?? 0) - duration
      await supabase.from('employee').update({ vacation_balance: newBalance }).eq('id', leave.employee_id)
    }
  }

  const updatePayload: any = { status }
  if (status === 'rejected' && rejectionReason) {
    updatePayload.rejection_reason = rejectionReason
  } else if (status === 'approved') {
    updatePayload.rejection_reason = null
  }

  const { data, error } = await supabase
    .from('conges')
    .update(updatePayload)
    .eq('id', leaveId)
    .select()

  // Insert real-time notification
  if (!error && leave) {
    const title = status === 'approved' ? 'Congé approuvé' : 'Congé refusé'
    let message = status === 'approved'
      ? `Votre demande de congé du ${leave.start_date} au ${leave.end_date} a été validée.`
      : `Votre demande de congé du ${leave.start_date} au ${leave.end_date} a été refusée.`

    if (status === 'rejected' && rejectionReason) {
      message += ` Motif : ${rejectionReason}`
    }

    await supabase.from('notifications').insert([{
      user_id: leave.employee_id,
      title,
      message,
      is_read: false
    }])
  }

  return { data: data?.[0] as Conge | null | undefined, error }
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
  const newBalance = (Number(employee.vacation_balance) || 0) + adjustment
  const { data, error } = await supabase
    .from('employee')
    .update({ vacation_balance: newBalance })
    .eq('id', employeeId)
    .select()

  return { data, error }
}
