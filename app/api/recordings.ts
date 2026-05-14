import { supabase } from '@/lib/supabase'
import type { Recording } from '@/lib/database.types'

export async function getAllRecordings(params: {
  page: number;
  pageSize: number;
  search?: string;
  dateRange?: [string, string];
  sizeFilter?: string;
}) {
  const { page, pageSize, search, dateRange, sizeFilter } = params;

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
    query = query.ilike('name', `%${search}%`);
  }

  // Date Range filter
  if (dateRange && dateRange[0] && dateRange[1]) {
    query = query.gte('created_at', dateRange[0]).lte('created_at', dateRange[1]);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (sizeFilter && sizeFilter !== 'All') {
    // We must fetch all and filter in memory since size is stored as string 'X.X MB'
    const { data: allData, error } = await query.order('created_at', { ascending: false });
    
    if (error) return { data: [], count: 0, error };
    
    const sortedData = (allData as any[]).map(record => {
      const sizeStr = record.size || '';
      let sizeInMB = 0;
      if (sizeStr.includes('MB')) {
        sizeInMB = parseFloat(sizeStr.replace('MB', '').trim());
      } else if (sizeStr.includes('GB')) {
        sizeInMB = parseFloat(sizeStr.replace('GB', '').trim()) * 1024;
      } else if (sizeStr.includes('KB')) {
        sizeInMB = parseFloat(sizeStr.replace('KB', '').trim()) / 1024;
      }
      return { ...record, _parsedSize: sizeInMB };
    }).sort((a, b) => {
      if (sizeFilter === 'asc') return a._parsedSize - b._parsedSize;
      if (sizeFilter === 'desc') return b._parsedSize - a._parsedSize;
      return 0;
    });

    const paginated = sortedData.slice(from, to + 1);
    return { data: paginated as unknown as Recording[], count: sortedData.length, error: null };
  } else {
    // Normal DB pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
      
    return { data: data as unknown as Recording[], count: count || 0, error };
  }
}

export async function uploadRecording(recording: any) {
  const { data, error } = await (supabase as any)
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

