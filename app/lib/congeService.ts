import { supabase } from './supabase'
import type { Conge } from './database.types'

/** Request a new leave (Employee) */
export async function requestLeave(leaveData: Omit<Conge, 'id' | 'created_at' | 'status'>) {
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
  const { data, error } = await supabase
    .from('conges')
    .update({ status })
    .eq('id', leaveId)
    .select()
  
  return { data: data?.[0] as Conge | null| undefined, error }
}
