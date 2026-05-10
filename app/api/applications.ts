import { supabase } from '@/lib/supabase'
import type { Application, DetailedApplication, ApplicationWithJob, ApplicationActivityItem } from '@/lib/database.types'

/** Apply to a Job */
export async function applyToJob(candidateId: string, jobId: string) {
  const { data, error } = await (supabase as any)
    .from('applications')
    .insert([{ candidate_id: candidateId, job_id: jobId }])
    .select()
    .single()
  
  if (!error && data) {
    // 1. Fetch User Data from Users table (reliable for both candidates and employees)
    const { data: userProfile } = await supabase
      .from('users')
      .select('user_name, role')
      .eq('id', candidateId)
      .single()

    // 2. Fetch Job Title
    const { data: jobInfo } = await supabase
      .from('jobs')
      .select('title')
      .eq('id', jobId)
      .single()

    const name = userProfile?.user_name || 'An employee'
    const role = userProfile?.role === 'employee' ? 'Internal Employee' : 'Candidate'
    const jobTitle = jobInfo?.title || 'a position'

    // 3. Send Notification to Admins via RPC (Must be RPC to bypass RLS)
    // @ts-ignore
    await supabase.rpc('create_admin_notification', {
      p_title: 'New Application Received',
      p_message: `${role} (${name}) has applied for the "${jobTitle}" position.`
    })
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
  
  return { data: data as ApplicationWithJob[] | null, error }
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
  
  return { data: data as DetailedApplication[] | null, error }
}

/** Update the status of a specific application */
export async function updateApplicationStatus(applicationId: string, status: 'pending' | 'accepted' | 'rejected') {
  const { data, error } = await (supabase as any)
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
    data: (data || []).map((item: ApplicationActivityItem) => ({
      ...item,
      candidate: {
        id: item.candidate_id,
        resume_url: item.resume_url,
        user: {
          user_name: item.user_name,
          avatar_url: item.avatar_url,
          email: item.email,
          role: item.role,
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
  const { error } = await (supabase as any)
    .from('applications')
    .update({ is_archived: true })
    .in('id', ids)
  
  return { error }
}

/** Restore archived applications */
export async function restoreApplications(ids: string[]) {
  const { error } = await (supabase as any)
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

/** Analyze application using external AI API (3-step protocol) */
export async function analyzeApplication(applicationId: string) {
  const API_BASE = 'http://localhost:5000/api'

  // 1. Get application details from Supabase
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select(`
      *,
      candidate:candidates(resume_url),
      job:jobs(title, description, requirements)
    `)
    .eq('id', applicationId)
    .single()

  if (fetchError || !application) {
    return { error: fetchError?.message || 'Application not found' }
  }

  const resumeUrl = (application as any).candidate?.resume_url
  const jobTitle = (application as any).job?.title || ''
  const jobDesc = (application as any).job?.description || ''
  const jobReq = (application as any).job?.requirements || ''

  if (!resumeUrl) return { error: 'No resume found' }

  try {
    // --- STEP 1: PARSE CV ---
    const fileRes = await fetch(resumeUrl)
    if (!fileRes.ok) {
      throw new Error(`Failed to fetch resume from Supabase (${fileRes.status})`)
    }
    const blob = await fileRes.blob()
    
    if (blob.size === 0) {
      throw new Error("The fetched resume file is empty")
    }

    const resumeFormData = new FormData()
    resumeFormData.append('file', blob, 'resume.pdf')

    const parseRes = await fetch(`${API_BASE}/resume/parse`, {
      method: 'POST',
      body: resumeFormData
    })
    if (!parseRes.ok) {
      const errText = await parseRes.text()
      throw new Error(`CV Parsing failed (${parseRes.status}): ${errText}`)
    }
    const parseData = await parseRes.json()
    const resumeId = parseData.id

    // --- STEP 2: CREATE JOB ---
    const jobRes = await fetch(`${API_BASE}/job/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: jobTitle,
        description: jobDesc,
        required_skills: [jobReq] // External API expects an array
      })
    })
    if (!jobRes.ok) {
      const errText = await jobRes.text()
      throw new Error(`Job Creation failed (${jobRes.status}): ${errText}`)
    }
    const jobData = await jobRes.json()
    const jobId = jobData.id

    // --- STEP 3: MATCH ---
    const matchRes = await fetch(`${API_BASE}/job/match/${jobId}/${resumeId}`)
    if (!matchRes.ok) {
      const errText = await matchRes.text()
      throw new Error(`Matching failed (${matchRes.status}): ${errText}`)
    }
    
    const analysisResult = await matchRes.json()

    // 4. Update Supabase with the final score
    // Handle both 'match_score' and any detailed report returned
    const finalScore = analysisResult.match_score || analysisResult.score || 0

    const { error: updateError } = await (supabase as any)
      .from('applications')
      .update({
        match_score: finalScore,
        ai_analysis: analysisResult
      })
      .eq('id', applicationId)

    if (updateError) throw updateError

    return { data: analysisResult, error: null }
  } catch (err: any) {
    console.error('Analysis Error:', err)
    return { error: err.message || 'An error occurred during analysis' }
  }
}

