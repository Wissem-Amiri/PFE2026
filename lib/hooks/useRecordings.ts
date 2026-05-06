import { useQuery } from '@tanstack/react-query'
import { getAllRecordings } from '@/app/api/recordings'
import { queryKeys } from './queryKeys'

export function useRecordings(params: {
  page: number;
  pageSize: number;
  search?: string;
} = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: [...queryKeys.recordings, params],
    queryFn: async () => {
      const { data, count, error } = await getAllRecordings(params)
      if (error) throw error
      return { data: data || [], count }
    }
  })
}
