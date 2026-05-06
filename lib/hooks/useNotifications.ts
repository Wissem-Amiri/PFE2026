import { useInfiniteQuery } from '@tanstack/react-query'
import { getNotificationsPaginated } from '@/app/api/notifications'
import { queryKeys } from './queryKeys'

export function useInfiniteNotifications(userId: string, pageSize = 10) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.notifications(userId), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const { data, count, error } = await getNotificationsPaginated(userId, {
        page: pageParam as number,
        pageSize,
      })
      if (error) throw error
      return { 
        data: data || [], 
        count, 
        nextPage: (data?.length || 0) < pageSize ? undefined : (pageParam as number) + 1 
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId
  })
}
