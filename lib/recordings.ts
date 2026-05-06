import { supabase } from './supabase'
import type { Recording } from './database.types'

export async function getAllRecordings(params: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  const { page, pageSize, search } = params;

  let query = supabase
    .from('recordings')
    .select(`
      *,
      uploader:uploaded_by (
        user_name,
        email,
        avatar_url
      )
    `, { count: 'exact' });

  // Basic search if needed
  if (search) {
    // Search on title if it exists, or just return all
    // query = query.ilike('title', `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
    
  return { data: data as unknown as Recording[], count: count || 0, error };
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
