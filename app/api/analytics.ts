import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

// ─────────────────────────────────────────────────────────
// KPIs with Month-over-Month comparison
// ─────────────────────────────────────────────────────────

export async function getKpiData() {
  const thisMonthStart = dayjs().startOf('month').toISOString()
  const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toISOString()
  const lastMonthEnd   = dayjs().subtract(1, 'month').endOf('month').toISOString()

  // Total employees
  const { count: totalEmp } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'employee').eq('is_archived', false)

  // Applications this month vs last month
  const { count: appsThis } = await supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', thisMonthStart).eq('is_archived', false)
  const { count: appsLast } = await supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', lastMonthStart).lte('applied_at', lastMonthEnd).eq('is_archived', false)

  // Pending leaves this month vs last month
  const { count: pendThis } = await supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('is_archived', false)
  const { count: pendLast } = await supabase.from('leaves').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd).eq('is_archived', false)

  // Acceptance rate this month vs last month
  const { count: totalThis }    = await supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', thisMonthStart).eq('is_archived', false)
  const { count: acceptedThis } = await supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', thisMonthStart).eq('status', 'accepted').eq('is_archived', false)
  const { count: totalLastA }   = await supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', lastMonthStart).lte('applied_at', lastMonthEnd)
  const { count: acceptedLast } = await supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', lastMonthStart).lte('applied_at', lastMonthEnd).eq('status', 'accepted')

  const rateThis = totalThis ? Math.round(((acceptedThis ?? 0) / totalThis) * 100) : 0
  const rateLast = totalLastA ? Math.round(((acceptedLast ?? 0) / totalLastA) * 100) : 0

  const diff = (a: number, b: number) => {
    if (b === 0) return { pct: 0, up: true }
    const pct = Math.round(((a - b) / b) * 100)
    return { pct: Math.abs(pct), up: pct >= 0 }
  }

  return {
    employees:   { value: totalEmp ?? 0, ...diff(totalEmp ?? 0, totalEmp ?? 0) },
    applications:{ value: appsThis ?? 0, ...diff(appsThis ?? 0, appsLast ?? 0) },
    pending:     { value: pendThis ?? 0, ...diff(pendThis ?? 0, pendLast ?? 0) },
    rate:        { value: rateThis,      ...diff(rateThis, rateLast) },
  }
}

// ─────────────────────────────────────────────────────────
// Applications over time (dynamic range: days parameter)
// ─────────────────────────────────────────────────────────

export async function getApplicationsPerMonth(months = 6) {
  const result = []
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toISOString()
    const end   = dayjs().subtract(i, 'month').endOf('month').toISOString()
    const label = dayjs().subtract(i, 'month').format('MMM YY')

    const [{ count: total }, { count: accepted }, { count: rejected }] = await Promise.all([
      supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', start).lte('applied_at', end),
      supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', start).lte('applied_at', end).eq('status', 'accepted'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).gte('applied_at', start).lte('applied_at', end).eq('status', 'rejected'),
    ])
    result.push({ label, total: total ?? 0, accepted: accepted ?? 0, rejected: rejected ?? 0 })
  }
  return result
}

// ─────────────────────────────────────────────────────────
// Status distribution (Doughnut)
// ─────────────────────────────────────────────────────────

export async function getApplicationStatusDistribution() {
  const statuses = ['pending', 'accepted', 'rejected', 'interviewing']
  return Promise.all(statuses.map(async status => {
    const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', status).eq('is_archived', false)
    return { status, count: count ?? 0 }
  }))
}

// ─────────────────────────────────────────────────────────
// Leaves per type (Bar)
// ─────────────────────────────────────────────────────────

export async function getLeavesPerType() {
  const types = ['Vacation', 'Sick', 'Casual', 'Personal']
  return Promise.all(types.map(async type => {
    const { count } = await supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('type', type).eq('is_archived', false)
    return { type, count: count ?? 0 }
  }))
}

// ─────────────────────────────────────────────────────────
// Employees by department (Horizontal Bar)
// ─────────────────────────────────────────────────────────

export async function getEmployeesByDepartment() {
  const { data } = await supabase.from('employee').select('department')
  if (!data) return []
  const counts: Record<string, number> = {}
  for (const emp of data) {
    const dept = (emp as any).department || 'Other'
    counts[dept] = (counts[dept] ?? 0) + 1
  }
  return Object.entries(counts).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────────────────
// Top 5 applied jobs
// ─────────────────────────────────────────────────────────

export async function getTopAppliedJobs() {
  const { data } = await supabase.from('applications').select('job:jobs(title)').eq('is_archived', false)
  if (!data) return []
  const counts: Record<string, number> = {}
  for (const app of data as any[]) {
    const title = app.job?.title || 'Unknown'
    counts[title] = (counts[title] ?? 0) + 1
  }
  return Object.entries(counts).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 5)
}

// ─────────────────────────────────────────────────────────
// AI Scores per application (for score distribution radar)
// ─────────────────────────────────────────────────────────

export async function getAiScoreDistribution() {
  const { data } = await supabase
    .from('applications')
    .select('match_score')
    .eq('is_archived', false)
    .not('match_score', 'is', null)

  if (!data || data.length === 0) return []

  const buckets = [
    { label: '0-20%', min: 0, max: 20, count: 0 },
    { label: '21-40%', min: 21, max: 40, count: 0 },
    { label: '41-60%', min: 41, max: 60, count: 0 },
    { label: '61-80%', min: 61, max: 80, count: 0 },
    { label: '81-100%', min: 81, max: 100, count: 0 },
  ]

  for (const app of data as any[]) {
    const score = (app.match_score ?? 0) * 100 // match_score is stored as 0.0-1.0
    for (const bucket of buckets) {
      if (score >= bucket.min && score <= bucket.max) { bucket.count++; break }
    }
  }
  return buckets
}

// ─────────────────────────────────────────────────────────
// Leaves monthly trend for current year (Line)
// ─────────────────────────────────────────────────────────

export async function getLeavesMonthlyTrend() {
  const result = []
  for (let i = 5; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toISOString()
    const end   = dayjs().subtract(i, 'month').endOf('month').toISOString()
    const label = dayjs().subtract(i, 'month').format('MMM YY')
    const { count } = await supabase.from('leaves').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end).eq('is_archived', false)
    result.push({ label, count: count ?? 0 })
  }
  return result
}

// ─────────────────────────────────────────────────────────
// Live activity timeline (latest 8 events)
// ─────────────────────────────────────────────────────────

export async function getActivityTimeline() {
  const [{ data: apps }, { data: leaves }] = await Promise.all([
    supabase.from('v_applications_activities').select('user_name, job_title, status, applied_at, avatar_url').order('applied_at', { ascending: false }).limit(4),
    supabase.from('leaves').select('employee_id, type, status, created_at').order('created_at', { ascending: false }).limit(4),
  ])

  const events: { type: 'application' | 'leave'; label: string; time: string; status: string }[] = []

  for (const app of (apps ?? []) as any[]) {
    events.push({ type: 'application', label: `${app.user_name} applied for "${app.job_title}"`, time: app.applied_at, status: app.status })
  }
  for (const leave of (leaves ?? []) as any[]) {
    events.push({ type: 'leave', label: `Leave request (${leave.type}) — ${leave.status}`, time: leave.created_at, status: leave.status })
  }

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)
}
