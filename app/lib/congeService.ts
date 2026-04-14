import { supabase } from './supabase'
import type { Conge } from './database.types'
import { getProfile } from './profileService'
import dayjs from 'dayjs'

/** Request a new leave (Employee) */
export async function requestLeave(leaveData: Omit<Conge, 'id' | 'created_at' | 'status'>) {
  // 1. Validation for ALL leave types (Vacation, Casual, Personal, Sick)
  const { data: profile } = await getProfile(leaveData.user_id)
  if (profile) {
    const duration = dayjs(leaveData.end_date).diff(dayjs(leaveData.start_date), 'day') + 1
    const currentBalance = profile.vacation_balance ?? 0
    
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
export async function getMyLeaves(userId: string) {
  const { data, error } = await supabase
    .from('conges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data: data as Conge[], error }
}

/** Get all leaves with user details (Admin) */
export async function getAllLeavesDetailed() {
  const { data, error } = await supabase
    .from('conges')
    .select(`
      *,
      user:utilisateur(*)
    `)
    .order('created_at', { ascending: false })
  
  return { data: data as (Conge & { user: any })[], error }
}

/** Update leave status (Admin) */
export async function updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected') {
  // If approving any leave, deduct from balance
  if (status === 'approved') {
    const { data: leave } = await supabase.from('conges').select('*').eq('id', leaveId).single()
    if (leave) {
      const duration = dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1
      const { data: profile } = await getProfile(leave.user_id)
      
      if (profile) {
        const newBalance = (profile.vacation_balance ?? 0) - duration
        await supabase.from('utilisateur').update({ vacation_balance: newBalance }).eq('id', leave.user_id)
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
