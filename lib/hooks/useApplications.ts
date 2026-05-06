import { useQuery } from '@tanstack/react-query'
import { getAllApplicationsDetailed } from '@/app/api/applications'
import { queryKeys } from './queryKeys'

export function useApplications(params: {
  page: number;
  pageSize: number;
  showArchived?: boolean;
  status?: string | string[];
  search?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
} = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: [...queryKeys.applications, params],
    queryFn: async () => {
      const { data, count, error } = await getAllApplicationsDetailed(params)
      if (error) throw error
      return { data: data || [], count }
    }
  })
}
