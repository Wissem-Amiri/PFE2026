import { useQuery } from '@tanstack/react-query'
import { getAllLeavesDetailed, getMyLeaves } from '@/app/api/leaves'
import { queryKeys } from './queryKeys'

export function useLeaves(params: {
  page: number;
  pageSize: number;
  showArchived?: boolean;
  status?: string | string[];
  search?: string;
  leaveType?: string | string[];
  startDate?: string;
  endDate?: string;
} = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: queryKeys.leaves(params),
    queryFn: async () => {
      const { data, count, error } = await getAllLeavesDetailed(params)
      if (error) throw error
      return { data: data || [], count }
    },
    select: (result) => ({
      count: result.count,
      data: (result.data as any[]).map(leave => ({
        ...leave,
        user: leave.employee ? {
          ...(leave.employee.user || {}),
          position: leave.employee.position
        } : null
      }))
    })
  })
}

export function useMyLeaves(userId: string, params: { 
  page: number, 
  pageSize: number, 
  search?: string,
  status?: string | string[],
  leaveType?: string | string[],
  startDate?: string,
  endDate?: string,
  sortOrder?: 'ascend' | 'descend'
} = { page: 1, pageSize: 5 }) {
  return useQuery({
    queryKey: [...queryKeys.myLeaves(userId), params],
    queryFn: async () => {
      const { data, count, error } = await getMyLeaves(userId, params)
      if (error) throw error
      return { data: data || [], count }
    },
    enabled: !!userId
  })
}
