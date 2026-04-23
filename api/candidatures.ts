import { supabase } from './supabase'
import type { Candidature } from './database.types'

/** Apply to a Job */
export async function applyToJob(postulantId: string, jobId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .insert([{ postulant_id: postulantId, job_id: jobId }])
    .select()
    .single()
  
  return { data: data as Candidature | null, error }
}

/** Check if user applied to a Job */
export async function checkIfApplied(postulantId: string, jobId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .select('id')
    .eq('postulant_id', postulantId)
    .eq('job_id', jobId)
    .maybeSingle()
  
  return { applied: !!data, error }
}

/** Get all candidatures for a user, including job details */
export async function getUserCandidatures(postulantId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .select(`
      *,
      job:jobs(*)
    `)
    .eq('postulant_id', postulantId)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Get all applicants for a specific job (Admin) */
export async function getJobApplications(jobId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .select(`
      *,
      postulant:postulant(
        *,
        user:utilisateur(*)
      )
    `)
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Update the status of a specific candidature */
export async function updateCandidatureStatus(candidatureId: string, status: 'pending' | 'accepted' | 'rejected') {
  const { data, error } = await supabase
    .from('candidatures')
    .update({ status })
    .eq('id', candidatureId)
    .select()
    .single()
  
  return { data: data as Candidature | null, error }
}

/** Get all candidatures with user and job info (Admin) */
export async function getAllCandidaturesDetailed(showArchived: boolean = false) {
  const { data, error } = await supabase
    .from('candidatures')
    .select(`
      *,
      postulant:postulant(
        *,
        user:utilisateur(*)
      ),
      job:jobs(*)
    `)
    .eq('is_archived', showArchived)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Get all ARCHIVED candidatures with user and job info (Admin) */
export async function getArchivedCandidaturesDetailed() {
  const { data, error } = await supabase
    .from('candidatures')
    .select(`
      *,
      postulant:postulant(
        *,
        user:utilisateur(*)
      ),
      job:jobs(*)
    `)
    .eq('is_archived', true)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Soft delete (Archive) candidatures */
export async function archiveCandidatures(ids: string[]) {
  const { error } = await supabase
    .from('candidatures')
    .update({ is_archived: true })
    .in('id', ids)
  
  return { error }
}

/** Restore archived candidatures */
export async function restoreCandidatures(ids: string[]) {
  const { error } = await supabase
    .from('candidatures')
    .update({ is_archived: false })
    .in('id', ids)
  
  return { error }
}

/** Permanent delete candidatures from database (Hard Delete) */
export async function hardDeleteCandidatures(ids: string[]) {
  const { error } = await supabase
    .from('candidatures')
    .delete()
    .in('id', ids)
  
  return { error }
}

/** Permanent delete all other candidatures for a user (Maintenance/Cleanup) */
export async function deleteAllOtherCandidatures(postulantId: string, excludeCandidatureId: string) {
  const { error } = await supabase
    .from('candidatures')
    .delete()
    .eq('postulant_id', postulantId)
    .neq('id', excludeCandidatureId)
  
  return { error }
}
