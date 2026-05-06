import { useQuery } from '@tanstack/react-query'
import { getAllJobs } from '@/app/api/job'
import { queryKeys } from './queryKeys'

export function useJobs(params?: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.jobs, params],
    queryFn: async () => {
      const { data, count, error } = await getAllJobs(params)
      if (error) throw error
      return { data: data || [], count }
    }
  })
}
