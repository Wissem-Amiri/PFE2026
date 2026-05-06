export const queryKeys = {
  leaves: (params?: any) => (params ? (['leaves', params] as const) : (['leaves'] as const)),
  applications: ['applications'] as const,
  recordings: ['recordings'] as const,
  jobs: ['jobs'] as const,
  employees: ['employees'] as const,
  myLeaves: (userId?: string) => (userId ? (['myLeaves', userId] as const) : (['myLeaves'] as const)),
  notifications: (userId?: string) => (userId ? (['notifications', userId] as const) : (['notifications'] as const)),
}
