'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Skeleton, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip as ChartTooltip, Legend, Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineTrendingUp, HiOutlineTrendingDown,
  HiOutlineBriefcase, HiOutlineCalendar, HiOutlineRefresh
} from 'react-icons/hi'
import {
  getKpiData, getApplicationsPerMonth, getApplicationStatusDistribution,
  getLeavesPerType, getEmployeesByDepartment, getTopAppliedJobs,
  getAiScoreDistribution, getLeavesMonthlyTrend, getActivityTimeline
} from '@/app/api/analytics'

dayjs.extend(relativeTime)

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, ChartTooltip, Legend, Filler
)

// ── Palette ───────────────────────────────────────────────
const P = {
  purple: '#7F56D9', blue: '#0BA5EC', green: '#12B76A',
  amber: '#F79009', red: '#F04438', indigo: '#6366F1',
  pink: '#EC4899', teal: '#14B8A6',
}

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({ label, value, icon, color, bg, pct, up, suffix = '' }:
  { label: string; value: number | string; icon: React.ReactNode; color: string; bg: string; pct: number; up: boolean; suffix?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#F2F4F7] shadow-sm p-6 flex flex-col gap-3 hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold text-[#98A2B3] uppercase tracking-widest">{label}</span>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110"
          style={{ background: bg, color }}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[36px] font-extrabold text-[#101828] leading-none">{value}{suffix}</span>
      </div>
      <div className={`flex items-center gap-1 text-[12px] font-bold ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
        {up ? <HiOutlineTrendingUp className="text-base" /> : <HiOutlineTrendingDown className="text-base" />}
        <span>{pct > 0 ? `${up ? '+' : '-'}${pct}% vs last month` : 'No change vs last month'}</span>
      </div>
    </div>
  )
}

// ── Chart Card ────────────────────────────────────────────
function ChartCard({ title, subtitle, badge, children, className = '' }:
  { title: string; subtitle?: string; badge?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#F2F4F7] shadow-sm p-6 flex flex-col gap-5 hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-bold text-[#101828] mb-0 leading-tight">{title}</h3>
          {subtitle && <p className="text-[12px] text-[#98A2B3] mt-1 mb-0">{subtitle}</p>}
        </div>
        {badge && (
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#F9F5FF] text-[#7F56D9] border border-[#E9D7FE] whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}



// ── Timeline Event ────────────────────────────────────────
function TimelineEvent({ event }: { event: any }) {
  const isApp = event.type === 'application'
  const color = isApp ? P.purple : P.amber
  const icon = isApp ? <HiOutlineBriefcase /> : <HiOutlineCalendar />
  const statusColor: Record<string, string> = {
    pending: '#F79009', accepted: '#12B76A', rejected: '#F04438', interviewing: '#0BA5EC'
  }
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F9FAFB] last:border-0 group">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
        style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#344054] mb-0 truncate">{event.label}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
            style={{ color: statusColor[event.status] ?? '#667085', borderColor: (statusColor[event.status] ?? '#667085') + '33', background: (statusColor[event.status] ?? '#667085') + '11' }}>
            {event.status}
          </span>
          <span className="text-[11px] text-[#98A2B3]">{dayjs(event.time).fromNow()}</span>
        </div>
      </div>
    </div>
  )
}

// ── Time Range Button ─────────────────────────────────────
function RangeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all duration-200 cursor-pointer border-none ${active ? 'bg-[#7F56D9] text-white shadow-md' : 'bg-[#F2F4F7] text-[#667085] hover:bg-[#E9D7FE] hover:text-[#7F56D9]'}`}>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [range, setRange] = useState(6)
  const [kpis, setKpis] = useState<any>(null)
  const [monthData, setMonthData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [leaveData, setLeaveData] = useState<any[]>([])
  const [leaveTrend, setLeaveTrend] = useState<any[]>([])
  const [deptData, setDeptData] = useState<any[]>([])
  const [topJobs, setTopJobs] = useState<any[]>([])
  const [aiScores, setAiScores] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])

  const fetchAll = useCallback(async (r = range, showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    const [kpiRes, months, statuses, leaves, leaveTrendRes, depts, jobs, scores, tl] = await Promise.all([
      getKpiData(),
      getApplicationsPerMonth(r),
      getApplicationStatusDistribution(),
      getLeavesPerType(),
      getLeavesMonthlyTrend(),
      getEmployeesByDepartment(),
      getTopAppliedJobs(),
      getAiScoreDistribution(),
      getActivityTimeline(),
    ])

    setKpis(kpiRes)
    setMonthData(months)
    setStatusData(statuses)
    setLeaveData(leaves)
    setLeaveTrend(leaveTrendRes)
    setDeptData(depts)
    setTopJobs(jobs)
    setAiScores(scores)
    setTimeline(tl)
    setLoading(false)
    setRefreshing(false)
  }, [range])

  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (isFirstLoad.current) {
      fetchAll(range, false)
      isFirstLoad.current = false
    } else {
      fetchAll(range, true)
    }
  }, [range, fetchAll])

  // ── Chart base options ────────────────────────────────
  const baseOpts = (yTitle = '') => ({
    responsive: true,
    animation: { duration: 600, easing: 'easeInOutQuart' as const },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1D2939', padding: 10, cornerRadius: 8, titleFont: { size: 12 }, bodyFont: { size: 12 } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#98A2B3', font: { size: 11 } } },
      y: { grid: { color: '#F2F4F7', lineWidth: 1 }, ticks: { color: '#98A2B3', font: { size: 11 } }, title: yTitle ? { display: true, text: yTitle, color: '#98A2B3', font: { size: 10 } } : undefined }
    }
  })

  const baseOptsH = () => ({
    ...baseOpts(),
    indexAxis: 'y' as const,
    scales: {
      x: { grid: { color: '#F2F4F7' }, ticks: { color: '#98A2B3', font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { color: '#344054', font: { size: 11, weight: 'bold' as const } } }
    }
  })

  // ── Chart data configs ────────────────────────────────

  const lineData = {
    labels: monthData.map(m => m.label),
    datasets: [
      { label: 'Total', data: monthData.map(m => m.total), borderColor: P.purple, backgroundColor: P.purple + '14', fill: true, tension: 0.4, pointBackgroundColor: P.purple, pointRadius: 4, pointHoverRadius: 7, borderWidth: 2 },
      { label: 'Accepted', data: monthData.map(m => m.accepted), borderColor: P.green, backgroundColor: 'transparent', tension: 0.4, pointBackgroundColor: P.green, pointRadius: 4, pointHoverRadius: 7, borderWidth: 2 },
      { label: 'Rejected', data: monthData.map(m => m.rejected), borderColor: P.red, backgroundColor: 'transparent', tension: 0.4, pointBackgroundColor: P.red, pointRadius: 4, pointHoverRadius: 7, borderWidth: 2 },
    ]
  }

  const donutData = {
    labels: statusData.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
    datasets: [{ data: statusData.map(s => s.count), backgroundColor: [P.amber, P.green, P.red, P.blue], borderColor: '#fff', borderWidth: 3, hoverOffset: 10 }]
  }

  const leaveBarData = {
    labels: leaveData.map(l => l.type),
    datasets: [{ label: 'Requests', data: leaveData.map(l => l.count), backgroundColor: [P.purple, P.red, P.blue, P.green], borderRadius: 10, borderSkipped: false }]
  }

  const leaveTrendData = {
    labels: leaveTrend.map(l => l.label),
    datasets: [{ label: 'Leave Requests', data: leaveTrend.map(l => l.count), borderColor: P.amber, backgroundColor: P.amber + '14', fill: true, tension: 0.4, pointBackgroundColor: P.amber, pointRadius: 4, pointHoverRadius: 7, borderWidth: 2 }]
  }

  const deptData2 = {
    labels: deptData.map(d => d.department),
    datasets: [{ label: 'Employees', data: deptData.map(d => d.count), backgroundColor: P.indigo, borderRadius: 8, borderSkipped: false }]
  }

  const jobsData = {
    labels: topJobs.map(j => j.title.length > 22 ? j.title.slice(0, 22) + '…' : j.title),
    datasets: [{ label: 'Applications', data: topJobs.map(j => j.count), backgroundColor: [P.purple, P.blue, P.green, P.amber, P.red], borderRadius: 8, borderSkipped: false }]
  }

  const aiScoreData = {
    labels: aiScores.map(b => b.label),
    datasets: [{ label: 'Candidates', data: aiScores.map(b => b.count), backgroundColor: [P.red, P.amber, P.blue, P.indigo, P.green], borderRadius: 10, borderSkipped: false }]
  }

  if (loading) return (
    <div className="p-8 bg-[#FCFCFD] min-h-screen flex flex-col gap-8">
      <Skeleton active paragraph={{ rows: 1 }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} active paragraph={{ rows: 3 }} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <Skeleton key={i} active paragraph={{ rows: 6 }} />)}</div>
    </div>
  )

  const kpiList = [
    { label: 'Total Employees',        ...kpis.employees,    value: kpis.employees.value,    icon: <HiOutlineUsers />,        color: P.purple, bg: P.purple + '18' },
    { label: 'Applications This Month',...kpis.applications, value: kpis.applications.value, icon: <HiOutlineClipboardList />, color: P.blue,   bg: P.blue   + '18' },
    { label: 'Pending Leaves',          ...kpis.pending,     value: kpis.pending.value,      icon: <HiOutlineClock />,        color: P.amber,  bg: P.amber  + '18', up: !kpis.pending.up },
    { label: 'Acceptance Rate',         ...kpis.rate,        value: kpis.rate.value,         icon: <HiOutlineCheckCircle />,  color: P.green,  bg: P.green  + '18', suffix: '%' },
  ]

  return (
    <div className="p-6 lg:p-8 bg-[#FCFCFD] min-h-screen flex flex-col gap-7 font-['Inter',sans-serif]">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#101828] m-0">Analytics Dashboard</h1>
          <p className="text-[13px] text-[#667085] m-0 mt-1">Real-time HR metrics & key performance indicators</p>
        </div>
        <button
          onClick={() => fetchAll(range, true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E4E7EC] text-[13px] font-bold text-[#344054] shadow-sm hover:bg-[#F9F5FF] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-all cursor-pointer ${refreshing ? 'opacity-70' : ''}`}
        >
          <HiOutlineRefresh className={`text-base ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiList.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* ── Row 1 : Line Chart + Gauge + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Line chart — 3 colonnes */}
        <div className="lg:col-span-3">
          <ChartCard 
            title="Applications Over Time" 
            subtitle="Monthly evolution — Total, Accepted & Rejected"
            className="h-full"
            badge={
              <div className="flex gap-1">
                {[3, 6, 12].map(r => <RangeBtn key={r} label={`${r}M`} active={range === r} onClick={() => setRange(r)} />)}
              </div>
            }>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              <Line data={lineData} options={{ ...baseOpts(), maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { color: '#344054', font: { size: 11, weight: 'bold' as const }, usePointStyle: true, padding: 16 } }, tooltip: { backgroundColor: '#1D2939', padding: 10, cornerRadius: 8 } } }} />
            </div>
          </ChartCard>
        </div>

        {/* Donut — 2 colonnes */}
        <div className="lg:col-span-2">
          <ChartCard title="Status Breakdown" subtitle="Current distribution" className="h-full">
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', animation: { duration: 600 }, plugins: { legend: { position: 'bottom', labels: { color: '#344054', font: { size: 11, weight: 'bold' as const }, usePointStyle: true, padding: 12 } }, tooltip: { backgroundColor: '#1D2939', padding: 10, cornerRadius: 8 } } }} />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── Row 2 : Leaves Bar + Leave Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Leave Requests by Type" subtitle="Distribution across all categories">
          <Bar data={leaveBarData} options={baseOpts('Count')} />
        </ChartCard>
        <ChartCard title="Leave Trend" subtitle="Monthly leave submissions over 6 months">
          <Line data={leaveTrendData} options={baseOpts('Requests')} />
        </ChartCard>
      </div>

      {/* ── Row 3 : Department + Top Jobs + AI Scores ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Employees by Department" subtitle="Workforce distribution">
          <Bar data={deptData2} options={baseOptsH()} />
        </ChartCard>
        <ChartCard title="Top 5 Applied Positions" subtitle="Most popular job postings">
          <Bar data={jobsData} options={baseOptsH()} />
        </ChartCard>
        <ChartCard title="AI Score Distribution" subtitle="CV matching scores — All candidates" badge="AI Powered">
          <Bar data={aiScoreData} options={baseOpts('%')} />
        </ChartCard>
      </div>

      {/* ── Row 4 : Activity Timeline ── */}
      <ChartCard title="Live Activity Feed" subtitle="Latest HR events across the platform">
        <div className="divide-y divide-[#F9FAFB]">
          {timeline.length === 0 ? (
            <p className="text-center text-[13px] text-[#98A2B3] py-8">No recent activity found.</p>
          ) : (
            timeline.map((event, i) => <TimelineEvent key={i} event={event} />)
          )}
        </div>
      </ChartCard>

    </div>
  )
}
