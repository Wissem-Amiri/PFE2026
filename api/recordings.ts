import { supabase } from './supabase'

export async function getAllRecordings() {
  const { data, error } = await supabase
    .from('recordings')
    .select(`
      *,
      uploader:uploaded_by (
        user_name,
        email,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function uploadRecording(recording: any) {
  const { data, error } = await supabase
    .from('recordings')
    .insert([recording])
    .select()
  return { data, error }
}

export async function deleteRecording(id: string) {
  const { error } = await supabase
    .from('recordings')
    .delete()
    .eq('id', id)
  return { error }
}
