import { supabase } from './supabase'
import type { Application } from './database.types'

/** Apply to a Job */
export async function applyToJob(candidateId: string, jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .insert([{ candidate_id: candidateId, job_id: jobId }])
    .select()
    .single()
  
  if (!error && data) {
    // 1. Fetch Candidate Name
    const { data: userData } = await supabase
      .from('users')
      .select('user_name')
      .eq('id', candidateId)
      .single()

    // 2. Fetch Job Title
    const { data: jobData } = await supabase
      .from('jobs')
      .select('title')
      .eq('id', jobId)
      .single()

    // 3. Send Notification to Admins
    if (userData && jobData) {
      // @ts-ignore
      await supabase.rpc('create_admin_notification', {
        p_title: 'New Application',
        p_message: `${userData.user_name || 'A candidate'} has applied for the "${jobData.title}" position.`
      })
    }
  }

  return { data: data as Application | null, error }
}

/** Check if user applied to a Job */
export async function checkIfApplied(candidateId: string, jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('job_id', jobId)
    .maybeSingle()
  
  return { applied: !!data, error }
}

/** Get all applications for a user, including job details */
export async function getUserApplications(candidateId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(*)
    `)
    .eq('candidate_id', candidateId)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Get all applicants for a specific job (Admin) */
export async function getJobApplications(jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      candidate:candidates(
        *,
        user:users(*)
      )
    `)
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Update the status of a specific application */
export async function updateApplicationStatus(applicationId: string, status: 'pending' | 'accepted' | 'rejected') {
  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single()
  
  return { data: data as Application | null, error }
}

/** Get all applications with user and job info (Admin) - Server Side Pagination & Filters */
export async function getAllApplicationsDetailed(params: {
  page: number;
  pageSize: number;
  showArchived?: boolean;
  status?: string | string[];
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
    .from('v_applications_activities')
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

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('applied_at', { ascending: false })
    .range(from, to);
  
  return { 
    data: (data || []).map(item => ({
      ...item,
      candidate: {
        id: item.candidate_id,
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

/** Get all ARCHIVED applications with user and job info (Admin) */
export async function getArchivedApplicationsDetailed() {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      candidate:candidates(
        *,
        user:users(*)
      ),
      job:jobs(*)
    `)
    .eq('is_archived', true)
    .order('applied_at', { ascending: false })
  
  return { data: data as any[], error }
}

/** Soft delete (Archive) applications */
export async function archiveApplications(ids: string[]) {
  const { error } = await supabase
    .from('applications')
    .update({ is_archived: true })
    .in('id', ids)
  
  return { error }
}

/** Restore archived applications */
export async function restoreApplications(ids: string[]) {
  const { error } = await supabase
    .from('applications')
    .update({ is_archived: false })
    .in('id', ids)
  
  return { error }
}

/** Permanent delete applications from database (Hard Delete) */
export async function hardDeleteApplications(ids: string[]) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .in('id', ids)
  
  return { error }
}

/** Permanent delete all other applications for a user (Maintenance/Cleanup) */
export async function deleteAllOtherApplications(candidateId: string, excludeApplicationId: string) {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('candidate_id', candidateId)
    .neq('id', excludeApplicationId)
  
  return { error }
}
