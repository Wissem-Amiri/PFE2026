import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { getEmployeesPaginated } from '@/app/api/profile'
import { queryKeys } from './queryKeys'

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
