import { supabase } from './supabase'
import type { Candidature } from './database.types'

/** Apply to a Job */
export async function applyToJob(candidatId: string, jobId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .insert([{ candidat_id: candidatId, job_id: jobId }])
    .select()
    .single()
  
  if (!error && data) {
    // 1. Fetch Candidate Name (Candidate has access to their own profile in utilisateur)
    const { data: userData } = await supabase
      .from('utilisateur')
      .select('user_name')
      .eq('id', candidatId)
      .single()

    // 2. Fetch Job Title (Jobs are public/readable by all authenticated)
    const { data: jobData } = await supabase
      .from('jobs')
      .select('title')
      .eq('id', jobId)
      .single()

    // 3. Send Notification to Admins via RPC
    if (userData && jobData) {
      // @ts-ignore - Database types might need a refresh to pick up the RPC
      await supabase.rpc('create_admin_notification', {
        p_title: 'Nouvelle candidature',
        p_message: `${userData.user_name || 'Un candidat'} a postulé pour le poste de "${jobData.title}".`
      })
    }
  }

  return { data: data as Candidature | null, error }
}

/** Check if user applied to a Job */
export async function checkIfApplied(candidatId: string, jobId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .select('id')
    .eq('candidat_id', candidatId)
    .eq('job_id', jobId)
    .maybeSingle()
  
  return { applied: !!data, error }
}

/** Get all candidatures for a user, including job details */
export async function getUserCandidatures(candidatId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .select(`
      *,
      job:jobs(*)
    `)
    .eq('candidat_id', candidatId)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Get all applicants for a specific job (Admin) */
export async function getJobApplications(jobId: string) {
  const { data, error } = await supabase
    .from('candidatures')
    .select(`
      *,
      candidat:candidat(
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

/** Get all candidatures with user and job info (Admin) - Server Side Pagination & Filters */
export async function getAllCandidaturesDetailed(params: {
  page: number;
  pageSize: number;
  showArchived?: boolean;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { 
    page, 
    pageSize, 
    showArchived = false, 
    status, 
    search, 
    startDate, 
    endDate 
  } = params;

  let query = supabase
    .from('v_candidatures_activities')
    .select('*', { count: 'exact' })
    .eq('is_archived', showArchived);

  // Filter by Status
  if (status && status !== 'All Status') {
    query = query.eq('status', status.toLowerCase());
  }

  // Filter by Search (Name or Job Title)
  if (search) {
    query = query.or(`job_title.ilike.%${search}%,user_name.ilike.%${search}%`);
  }

  // Filter by Date Range
  if (startDate) {
    query = query.gte('applied_at', startDate);
  }
  if (endDate) {
    query = query.lte('applied_at', endDate);
  }

  // Note: Search across joined tables (user_name, job_title) 
  // is best handled via a View or RPC for performance,
  // but for now we'll handle the basic filters server-side.
  // If search is present, we might need a more complex query.

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('applied_at', { ascending: false })
    .range(from, to);
  
  return { 
    data: (data || []).map(item => ({
      ...item,
      candidat: {
        id: item.candidat_id,
        user: {
          user_name: item.user_name,
          avatar_url: item.avatar_url,
          email: item.email,
          phone: item.phone
        }
      },
      job: {
        id: item.job_id,
        title: item.job_title
      }
    })), 
    count: count || 0, 
    error 
  };
}

/** Get all ARCHIVED candidatures with user and job info (Admin) */
export async function getArchivedCandidaturesDetailed() {
  const { data, error } = await supabase
    .from('candidatures')
    .select(`
      *,
      candidat:candidat(
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
export async function deleteAllOtherCandidatures(candidatId: string, excludeCandidatureId: string) {
  const { error } = await supabase
    .from('candidatures')
    .delete()
    .eq('candidat_id', candidatId)
    .neq('id', excludeCandidatureId)
  
  return { error }
}
