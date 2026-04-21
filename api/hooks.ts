import { useQuery } from '@tanstack/react-query'
import { getAllLeavesDetailed } from './conge'
import { getAllCandidaturesDetailed } from './candidatures'

export const queryKeys = {
  leaves: ['leaves'] as const,
  candidatures: ['candidatures'] as const,
}

export function useLeaves() {
  return useQuery({
    queryKey: queryKeys.leaves,
    queryFn: async () => {
      const { data, error } = await getAllLeavesDetailed()
      if (error) throw error
      return data || []
    },
    select: (data) => data.map(leave => ({
      ...leave,
      user: leave.employee ? {
        ...(leave.employee.user || {}),
        position: leave.employee.position
      } : null
    }))
  })
}

export function useCandidatures() {
  return useQuery({
    queryKey: queryKeys.candidatures,
    queryFn: async () => {
      const { data, error } = await getAllCandidaturesDetailed()
      if (error) throw error
      return data || []
    }
  })
}
