import { supabase } from './supabase'
import type { Database, Job } from './database.types'

export async function getAllJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  return { data: data as Job[] | null, error }
}

export async function createJob(jobData: Database['public']['Tables']['jobs']['Insert']) {
  const { data, error } = await supabase
    .from('jobs')
    // @ts-expect-error fallback generic issues
    .insert([jobData])
    .select()
    .single()

  return { data: data as Job | null, error }
}

export async function updateJob(id: string, jobData: Database['public']['Tables']['jobs']['Update']) {
  const { data, error } = await supabase
    .from('jobs')
    // @ts-expect-error fallback generic issues
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
