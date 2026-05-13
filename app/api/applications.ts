import { supabase } from '@/lib/supabase'
import type { Application, DetailedApplication, ApplicationWithJob, ApplicationActivityItem } from '@/lib/database.types'
import { calculateScoreFromParsedCV, type ParsedCVData } from './aiScoring'

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
  minScore?: number;
  maxScore?: number;
  minExperience?: number; // in months
  maxExperience?: number; // in months
  jobId?: string;
}) {
  const { 
    page, 
    pageSize, 
    showArchived = false, 
    status, 
    search, 
    startDate, 
    endDate,
    minScore,
    maxScore,
    minExperience,
    maxExperience,
    jobId
  } = params;

  // We query 'applications' table directly to ensure we get match_score and ai_analysis
  let query = supabase
    .from('applications')
    .select(`
      *,
      candidate:candidates(
        *,
        user:users(*)
      ),
      job:jobs(*)
    `, { count: 'exact' })
    .eq('is_archived', showArchived);

  // Filter by Job
  if (jobId && jobId !== 'all') {
    query = query.eq('job_id', jobId);
  }

  // Filter by Score (Server-side)
  if (minScore !== undefined) {
    query = query.gte('match_score', minScore);
  }
  if (maxScore !== undefined) {
    query = query.lte('match_score', maxScore);
  }

  // Filter by Experience (Server-side)
  if (minExperience !== undefined) {
    query = query.gte('total_experience_months', minExperience);
  }
  if (maxExperience !== undefined) {
    query = query.lte('total_experience_months', maxExperience);
  }

  // Filter by Status
  if (status && status !== 'All Status') {
    if (Array.isArray(status) && status.length > 0) {
      query = query.in('status', status.map(s => s.toLowerCase()));
    } else if (typeof status === 'string') {
      query = query.eq('status', status.toLowerCase());
    }
  }

  // Filter by Search (Note: Searching joined tables in Supabase requires careful syntax or simpler filters)
  // For simplicity and reliability with the score, we'll keep the basic filters here.
  
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
  
  console.log('Applications from DB:', data);
  if (error) console.error('Supabase Fetch Error:', error);
  
  return { 
    data: (data || []).map((item: any) => ({
      ...item,
      // Ensure the structure matches what the UI expects
      job_title: item.job?.title,
      user_name: item.candidate?.user?.user_name,
      avatar_url: item.candidate?.user?.avatar_url
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

/**
 * Processes parsed CV data, calculates the match score against the job,
 * and updates the application record in Supabase.
 */
export async function processParsedCVData(applicationId: string, cvData: ParsedCVData) {
  // 1. Fetch application and job details
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(title, description, requirements)
    `)
    .eq('id', applicationId)
    .single()

  if (fetchError || !application) {
    return { error: fetchError?.message || 'Application not found' }
  }

  const job = (application as any).job
  if (!job) return { error: 'Job details not found' }

  // 2. Calculate Score & Experience
  const { score: finalScore, totalExperienceMonths } = calculateScoreFromParsedCV(cvData, {
    title: job.title,
    description: job.description || '',
    requirements: job.requirements || ''
  })

  // 3. Prepare enriched analysis
  const enrichedAnalysis = {
    score: finalScore,
    totalExperienceMonths,
    strengths: [...(cvData.Skills || []), ...(cvData.Certification || [])].slice(0, 6),
    experience_relevance: `Worked as: ${cvData.Worked_As?.join(', ') || 'N/A'}. Total experience: ${cvData.Years_Of_Experience?.join(', ') || 'N/A'}.`,
    experience_list: (cvData.Worked_As || []).map((role, index) => ({
      role: role.replace(/\n/g, ' ').trim(),
      duration: cvData.Years_Of_Experience?.[index] || 'N/A'
    })),
    ...cvData
  }

  // 4. Update Supabase
  const { error: updateError } = await (supabase as any)
    .from('applications')
    .update({
      match_score: finalScore,
      total_experience_months: totalExperienceMonths,
      ai_analysis: enrichedAnalysis
    })
    .eq('id', applicationId)

  if (updateError) return { error: updateError.message }

  return { data: enrichedAnalysis, error: null }
}

/** Analyze application using external AI API (Local Scoring Protocol) */
export async function analyzeApplication(applicationId: string) {
  const API_BASE = 'http://localhost:5000/api'

  // 1. Get application details to get resume URL
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select(`
      *,
      candidate:candidates(resume_url)
    `)
    .eq('id', applicationId)
    .single()

  if (fetchError || !application) {
    return { error: fetchError?.message || 'Application not found' }
  }

  const resumeUrl = (application as any).candidate?.resume_url
  if (!resumeUrl) return { error: 'No resume found' }

  try {
    // --- STEP 1: PARSE CV ---
    const fileRes = await fetch(resumeUrl)
    if (!fileRes.ok) {
      throw new Error(`Failed to fetch resume from Supabase (${fileRes.status})`)
    }
    const blob = await fileRes.blob()
    
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
    const parseData: ParsedCVData = await parseRes.json()

    // --- STEP 2 & 3: PROCESS AND UPDATE ---
    return await processParsedCVData(applicationId, parseData)

  } catch (err: any) {
    console.error('Analysis Error:', err)
    return { error: err.message || 'An error occurred during analysis' }
  }
}

