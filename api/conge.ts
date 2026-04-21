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
  
  return { data: data?.[0] as Conge | null | undefined, error }
}

/** Get leaves for a specific user (Employee) */
export async function getMyLeaves(employeeId: string) {
  const { data, error } = await supabase
    .from('conges')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  
  return { data: data as Conge[], error }
}

/** Get all leaves with user details (Admin) */
export async function getAllLeavesDetailed() {
  const { data, error } = await supabase
    .from('conges')
    .select(`
      *,
      employee:employee(
        *,
        user:utilisateur(*)
      )
    `)
    .order('created_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Update leave status (Admin) */
export async function updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected') {
  // If approving any leave, deduct from balance
  if (status === 'approved') {
    const { data: leave } = await supabase.from('conges').select('*').eq('id', leaveId).single()
    if (leave) {
      const duration = dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1
      const { data: profile } = await getProfile(leave.employee_id)
      
      if (profile?.employee) {
        const newBalance = (profile.employee.vacation_balance ?? 0) - duration
        await supabase.from('employee').update({ vacation_balance: newBalance }).eq('id', leave.employee_id)
      }
    }
  }

  const { data, error } = await supabase
    .from('conges')
    .update({ status })
    .eq('id', leaveId)
    .select()
  
  return { data: data?.[0] as Conge | null| undefined, error }
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
