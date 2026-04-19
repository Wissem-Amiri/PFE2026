import { supabase } from './supabase'
import type { Database, Job } from './database.types'

export async function getAllJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  return { data: data as Job[] | null, error }
}

export async function getJobById(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as Job | null, error }
}

export async function createJob(jobData: Database['public']['Tables']['jobs']['Insert']) {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single()

  return { data: data as Job | null, error }
}

export async function updateJob(id: string, jobData: Database['public']['Tables']['jobs']['Update']) {
  const { data, error } = await supabase
    .from('jobs')
    .update(jobData)
    .eq('id', id)
    .select()
    .single()

  return { data: data as Job | null, error }
}

export async function deleteJob(id: string) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)

  return { error }
}

/** Upload job picture to bucket */
export async function uploadJobPicture(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('job-pictures')
    .upload(filePath, file)

  if (uploadError) {
    return { data: null, error: uploadError }
  }

  const { data } = supabase.storage
    .from('job-pictures')
    .getPublicUrl(filePath)

  return { publicUrl: data.publicUrl, error: null }
}

/** Decrement available seats and close job if 0 */
export async function decrementJobSeats(jobId: string) {
  const { data: job, error: fetchError } = await getJobById(jobId)
  if (fetchError || !job) return { error: fetchError || new Error('Job not found') }

  const newSeats = Math.max(0, job.open_seats - 1)
  const updates: Partial<Job> = { open_seats: newSeats }

  if (newSeats === 0) {
    updates.is_open = false
  }

  const { error: updateError } = await updateJob(jobId, updates)
  return { error: updateError }
}
