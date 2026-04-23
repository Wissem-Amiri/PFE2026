import { useQuery } from '@tanstack/react-query'
import { getAllLeavesDetailed } from './conge'
import { getAllCandidaturesDetailed } from './candidatures'
import { getAllRecordings } from './recordings'

export const queryKeys = {
  leaves: ['leaves'] as const,
  candidatures: ['candidatures'] as const,
  recordings: ['recordings'] as const,
}

export function useLeaves(showArchived: boolean = false) {
  return useQuery({
    queryKey: [...queryKeys.leaves, showArchived],
    queryFn: async () => {
      const { data, error } = await getAllLeavesDetailed(showArchived)
      if (error) throw error
      return data || []
    },
    select: (data) => (data as any[]).map(leave => ({
      ...leave,
      user: leave.employee ? {
        ...(leave.employee.user || {}),
        position: leave.employee.position
      } : null
    }))
  })
}

export function useCandidatures(showArchived: boolean = false) {
  return useQuery({
    queryKey: [...queryKeys.candidatures, showArchived],
    queryFn: async () => {
      const { data, error } = await getAllCandidaturesDetailed(showArchived)
      if (error) throw error
      return data || []
    }
  })
}

export function useRecordings(showArchived: boolean = false) {
  return useQuery({
    queryKey: [...queryKeys.recordings, showArchived],
    queryFn: async () => {
      const { data, error } = await getAllRecordings(showArchived)
      if (error) throw error
      return data || []
    }
  })
}
