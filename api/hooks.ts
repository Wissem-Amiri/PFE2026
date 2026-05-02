import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { getAllLeavesDetailed } from './leaves'
import { getAllApplicationsDetailed } from './applications'
import { getAllRecordings } from './recordings'
import { getAllJobs } from './job'
import { getEmployeesPaginated } from './profile'
import { getMyLeaves } from './leaves'

export const queryKeys = {
  leaves: (params?: any) => (params ? ['leaves', params] : ['leaves']) as const,
  applications: ['applications'] as const,
  recordings: ['recordings'] as const,
  jobs: ['jobs'] as const,
  employees: ['employees'] as const,
  myLeaves: (userId?: string) => (userId ? ['myLeaves', userId] : ['myLeaves']) as const,
}

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

export function useEmployees(params: {
  page: number;
  pageSize: number;
  search?: string;
  department?: string;
  showArchived?: boolean;
} = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: [...queryKeys.employees, params],
    queryFn: async () => {
      const { data, count, error } = await getEmployeesPaginated(params)
      if (error) throw error
      return { data: data || [], count }
    }
  })
}

export function useInfiniteEmployees(params: {
  pageSize: number;
  search?: string;
  department?: string;
  showArchived?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.employees, 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const { data, count, error } = await getEmployeesPaginated({
        ...params,
        page: pageParam as number,
      })
      if (error) throw error
      return { data: data || [], count, nextPage: (data?.length || 0) < params.pageSize ? undefined : (pageParam as number) + 1 }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
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
