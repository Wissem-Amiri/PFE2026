'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getJobApplications, updateApplicationStatus } from '@/lib/applications'
import { Avatar, Spin, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { Job } from '@/lib/database.types'
import { scoreCandidate, type Strength } from '@/lib/aiScoring'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Candidate {
  id: string
  score: number
  name: string
  email: string
  avatar?: string
  strengths: Strength[]
  yearsLabel: string
  prevCompanies: string
  online: boolean
  status: string
  hasExperience: boolean
}

// ─── Circular Score Ring ──────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const fill = circ * (1 - score / 100)
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#7c3aed' : '#f59e0b'
  return (
    <div className="relative w-[64px] h-[64px] flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90 absolute">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${circ}`} strokeDashoffset={`${fill}`} strokeLinecap="round" />
      </svg>
      <span className="text-[13px] font-extrabold text-[#0f172a] z-10">{score}%</span>
    </div>
  )
}

// ─── Strength Tag ─────────────────────────────────────────────────────────────
const TAG_COLORS = {
  purple: 'bg-[#f5f3ff] text-[#7c3aed]',
  green: 'bg-[#ecfdf5] text-[#059669]',
  amber: 'bg-[#fffbeb] text-[#d97706]',
}
function StrengthTag({ label, color }: Strength) {
  return (
    <span className={`px-2 py-[3px] rounded-[6px] text-[10px] font-bold uppercase tracking-tight ${TAG_COLORS[color]}`}>
      {label}
    </span>
  )
}

// ─── Skill Bar ────────────────────────────────────────────────────────────────
function SkillBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[12px]">
        <span className="font-bold text-[#0f172a]">{label}</span>
        <span className="text-[#64748b]">{pct}%</span>
      </div>
      <div className="bg-[#f1f5f9] h-[6px] rounded-full overflow-hidden w-full">
        <div className="bg-[#8b5cf6] h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIScreeningPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [scoreFilter, setScoreFilter] = useState('All Scores')
  const [expFilter, setExpFilter] = useState('All Levels')
  const [page, setPage] = useState(1)
  const perPage = 4
  const [messageApi, ctx] = message.useMessage()

  useEffect(() => {
    async function load() {
      // 1. Load job details
      const { data: jobData } = await supabase
        .from('jobs').select('*').eq('id', jobId).single()
      if (jobData) setJob(jobData as Job)

      // 2. Load applications with full candidate data
      const { data: apps } = await getJobApplications(jobId)

      if (apps && jobData) {
        const mapped: Candidate[] = apps.map((app: any) => {
          // Real data structure: app.candidate.user (from applications API)
          const candidate = app.candidate || {}
          const user = candidate.user || {}
          const experiences = candidate.experiences || []

          const scored = scoreCandidate(
            {
              bio: candidate.bio,
              position: candidate.position,
              experiences,
              portfolio: candidate.portfolio,
              resume_url: candidate.resume_url,
            },
            {
              title: jobData.title,
              description: jobData.description,
              requirements: jobData.requirements,
            }
          )

          return {
            id: app.id,
            score: scored.score,
            name: user.user_name || 'Candidate',
            email: user.email || '',
            avatar: user.avatar_url || undefined,
            strengths: scored.strengths,
            yearsLabel: scored.yearsLabel,
            prevCompanies: scored.prevCompanies,
            online: app.status === 'pending',
            status: app.status,
            hasExperience: experiences.length > 0,
          }
        })

        // Sort by score descending
        mapped.sort((a, b) => b.score - a.score)
        setCandidates(mapped)
      }

      setLoading(false)
    }
    load()
  }, [jobId])

  // ─── Filters ───────────────────────────────────────────────────────────────
  const filtered = candidates.filter(c => {
    const scoreOk =
      scoreFilter === 'All Scores' ||
      (scoreFilter === 'Above 90%' && c.score >= 90) ||
      (scoreFilter === 'Above 80%' && c.score >= 80) ||
      (scoreFilter === 'Above 70%' && c.score >= 70)

    const expOk =
      expFilter === 'All Levels' ||
      (expFilter === 'No Experience' && !c.hasExperience) ||
      (expFilter === 'With Experience' && c.hasExperience)

    return scoreOk && expOk
  })

  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const avgScore = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length * 10) / 10
    : 0

  // Skill saturation based on real strengths
  const skillCounts: Record<string, number> = {}
  candidates.forEach(c => c.strengths.forEach(s => {
    skillCounts[s.label] = (skillCounts[s.label] || 0) + 1
  }))
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label, count]) => ({ label, pct: Math.round((count / Math.max(candidates.length, 1)) * 100) }))

  const handleApprove = async (c: Candidate) => {
    const { error } = await updateApplicationStatus(c.id, 'accepted')
    if (!error) {
      messageApi.success(`${c.name} approved`)
      setCandidates(p => p.map(x => x.id === c.id ? { ...x, status: 'accepted' } : x))
    } else messageApi.error('Action failed')
  }

  const handleReject = async (c: Candidate) => {
    const { error } = await updateApplicationStatus(c.id, 'rejected')
    if (!error) {
      messageApi.success(`${c.name} rejected`)
      setCandidates(p => p.map(x => x.id === c.id ? { ...x, status: 'rejected' } : x))
    } else messageApi.error('Action failed')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spin size="large" />
    </div>
  )

  return (
    <div className="min-h-full bg-[#f8fafc] pt-[32px] pb-[48px] px-[32px]">
      {ctx}

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-[24px]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-[6px] text-[12px]">
            <button onClick={() => router.push('/dashboard/admin/jobs')} className="text-[#64748b] font-medium bg-transparent border-none cursor-pointer hover:text-[#7c3aed] transition-colors p-0">Jobs</button>
            <span className="text-[#cbd5e1]">›</span>
            <span className="text-[#64748b] font-medium">{job?.category || '—'}</span>
            <span className="text-[#cbd5e1]">›</span>
            <span className="text-[#7c3aed] font-semibold">{job?.title || '—'}</span>
          </div>
          <h1 className="text-[30px] font-extrabold text-[#0f172a] tracking-tight leading-[36px] m-0">AI Screening Dashboard</h1>
          <p className="text-[#64748b] text-[16px] m-0">
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} for this position
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-[16px] py-[9px] bg-white border border-[#e2e8f0] rounded-[8px] text-[14px] font-semibold text-[#0f172a] cursor-pointer hover:bg-[#f8fafc] transition-colors shadow-sm">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 5l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Export
          </button>
          <button onClick={() => router.push(`/dashboard/admin/jobs/${jobId}`)}
            className="flex items-center gap-2 px-[16px] py-[9px] bg-[#7c3aed] rounded-[8px] text-[14px] font-semibold text-white cursor-pointer hover:bg-[#6d28d9] transition-colors shadow-md shadow-purple-200 border-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Job
          </button>
        </div>
      </div>

      {/* ── Filters + AI Status ── */}
      <div className="grid grid-cols-12 gap-4 mb-[24px]">
        <div className="col-span-8 bg-white border border-[#f1f5f9] rounded-[12px] shadow-sm flex items-center gap-6 px-[18px] py-[17px]">
          {[
            { label: 'SCORE:', value: scoreFilter, set: setScoreFilter, opts: ['All Scores', 'Above 90%', 'Above 80%', 'Above 70%'] },
            { label: 'EXPERIENCE:', value: expFilter, set: setExpFilter, opts: ['All Levels', 'With Experience', 'No Experience'] },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">{label}</span>
              <div className="relative">
                <select value={value} onChange={e => { set(e.target.value); setPage(1) }}
                  className="bg-[#f8fafc] px-3 py-[6px] pr-7 rounded-[8px] text-[14px] font-medium text-[#0f172a] border-none outline-none appearance-none cursor-pointer">
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 10 10">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
          <div className="ml-auto text-[12px] text-[#94a3b8] font-medium">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="col-span-4 bg-[#7c3aed] rounded-[12px] flex items-center justify-between px-4 py-4 shadow-[0_10px_15px_-3px_#ddd6fe,0_4px_6px_-4px_#ddd6fe]">
          <div>
            <p className="text-[#ede9fe] text-[12px] font-medium opacity-80 m-0">AI Automation Status</p>
            <p className="text-white text-[18px] font-bold m-0 leading-[28px]">Active Screening</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
            <span className="text-white text-[12px] font-bold uppercase tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Candidates Table ── */}
      <div className="bg-white border border-[#f1f5f9] rounded-[16px] shadow-[0_20px_25px_-5px_rgba(226,232,240,0.5)] mb-[24px] overflow-hidden">
        {/* Header */}
        <div className="grid bg-[rgba(248,250,252,0.5)] border-b border-[#f1f5f9]"
          style={{ gridTemplateColumns: '300px 180px 1fr 180px 180px' }}>
          {['CANDIDATE', 'AI SCORE', 'STRENGTHS', 'EXPERIENCE', 'ACTIONS'].map((h, i) => (
            <div key={h} className={`px-6 py-4 text-[12px] font-bold text-[#94a3b8] uppercase tracking-widest ${i === 1 ? 'text-center' : i === 4 ? 'text-right' : ''}`}>
              {h}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#f8fafc] border border-[#f1f5f9] flex items-center justify-center text-2xl">🔍</div>
            <p className="text-[#0f172a] font-bold text-[16px] m-0">No candidates found</p>
            <p className="text-[#64748b] text-[14px] m-0">Try adjusting the filters above.</p>
          </div>
        ) : paged.map((c, idx) => (
          <div key={c.id}
            className={`grid items-center py-5 ${idx > 0 ? 'border-t border-[#f8fafc]' : ''} hover:bg-[#fafafa] transition-colors`}
            style={{ gridTemplateColumns: '300px 180px 1fr 180px 180px' }}>

            {/* Candidate */}
            <div className="px-6 flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar size={48} src={c.avatar} icon={<UserOutlined />}
                  className="bg-[#f5f3ff] text-[#7c3aed]" style={{ borderRadius: 12 }} />
                <div className={`absolute bottom-[-3px] right-[-3px] w-4 h-4 rounded-full border-2 border-white ${c.status === 'pending' ? 'bg-[#22c55e]' : c.status === 'accepted' ? 'bg-[#3b82f6]' : 'bg-[#cbd5e1]'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[#0f172a] font-bold text-[15px] m-0 truncate">{c.name}</p>
                <p className="text-[#64748b] text-[12px] font-medium m-0 truncate">{c.email}</p>
              </div>
            </div>

            {/* Score */}
            <div className="flex justify-center">
              <ScoreRing score={c.score} />
            </div>

            {/* Strengths */}
            <div className="px-6 flex flex-wrap gap-2">
              {c.strengths.map(s => <StrengthTag key={s.label} label={s.label} color={s.color} />)}
            </div>

            {/* Experience */}
            <div className="px-6">
              {c.hasExperience ? (
                <>
                  <p className="text-[#334155] font-bold text-[14px] m-0">{c.yearsLabel}</p>
                  <p className="text-[#64748b] text-[10px] font-medium m-0 truncate">Prev: {c.prevCompanies}</p>
                </>
              ) : (
                <span className="text-[12px] text-[#94a3b8] font-medium italic">No experience</span>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 flex items-center justify-end gap-2">
              <button title="Approve" onClick={() => handleApprove(c)} disabled={c.status === 'accepted'}
                className={`w-9 h-9 rounded-[8px] flex items-center justify-center transition-all border-none ${c.status === 'accepted' ? 'bg-[#dcfce7] opacity-40 cursor-not-allowed' : 'bg-[#f0fdf4] hover:bg-[#dcfce7] cursor-pointer'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button title="Reject" onClick={() => handleReject(c)} disabled={c.status === 'rejected'}
                className={`w-9 h-9 rounded-[8px] flex items-center justify-center transition-all border-none ${c.status === 'rejected' ? 'bg-[#fee2e2] opacity-40 cursor-not-allowed' : 'bg-[#fef2f2] hover:bg-[#fee2e2] cursor-pointer'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button title="View profile" onClick={() => router.push(`/dashboard/admin/registrations/${candidates.find(x => x.id === c.id)?.id}`)}
                className="w-9 h-9 rounded-[8px] bg-[#f8fafc] hover:bg-[#f1f5f9] flex items-center justify-center transition-all cursor-pointer border-none">
                <svg width="17" height="12" viewBox="0 0 18 13" fill="none"><path d="M1 6.5C1 6.5 4 1 9 1s8 5.5 8 5.5-3 5.5-8 5.5S1 6.5 1 6.5z" stroke="#64748b" strokeWidth="1.5" /><circle cx="9" cy="6.5" r="2" stroke="#64748b" strokeWidth="1.5" /></svg>
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#f1f5f9] bg-[rgba(248,250,252,0.5)]">
            <p className="text-[12px] font-medium text-[#64748b] m-0">
              Showing <span className="font-bold text-[#0f172a]">{(page - 1) * perPage + 1} – {Math.min(page * perPage, filtered.length)}</span> of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-[8px] border border-[#e2e8f0] flex items-center justify-center text-[#64748b] disabled:opacity-40 hover:bg-[#f8fafc] cursor-pointer bg-white">
                <svg width="5" height="8" viewBox="0 0 5 8"><path d="M4 1L1 4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-[8px] text-[12px] font-bold flex items-center justify-center transition-all cursor-pointer border-none ${n === page ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-200' : 'border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] bg-white'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="w-8 h-8 rounded-[8px] border border-[#e2e8f0] flex items-center justify-center text-[#64748b] disabled:opacity-40 hover:bg-[#f8fafc] cursor-pointer bg-white">
                <svg width="5" height="8" viewBox="0 0 5 8"><path d="M1 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Stats ── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Skill Saturation */}
        <div className="bg-white border border-[#f1f5f9] rounded-[16px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-widest">SKILL SATURATION</span>
            <svg width="19" height="18" viewBox="0 0 19 18" fill="none"><rect x="1" y="10" width="3" height="7" rx="1.5" fill="#94a3b8" /><rect x="6" y="6" width="3" height="11" rx="1.5" fill="#94a3b8" /><rect x="11" y="2" width="3" height="15" rx="1.5" fill="#7c3aed" /><rect x="16" y="8" width="3" height="9" rx="1.5" fill="#94a3b8" /></svg>
          </div>
          <div className="flex flex-col gap-3">
            {topSkills.length > 0
              ? topSkills.map(s => <SkillBar key={s.label} label={s.label} pct={s.pct} />)
              : <p className="text-[13px] text-[#94a3b8] italic m-0">Not enough data</p>
            }
          </div>
        </div>

        {/* Average AI Score */}
        <div className="bg-white border border-[#f1f5f9] rounded-[16px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-widest">AVERAGE AI SCORE</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 13L6 8l4 3 4-6 2 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="flex flex-col items-center gap-1 py-2">
            <span className="text-[40px] font-extrabold text-[#0f172a] tracking-tight leading-none">{avgScore}%</span>
            <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider mt-1">Score based on real data</span>
          </div>
        </div>

        {/* AI Note */}
        <div className="bg-[#7c3aed] rounded-[16px] p-6 shadow-[0_10px_15px_-3px_#ddd6fe,0_4px_6px_-4px_#ddd6fe] flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white opacity-5 rounded-full" />
          <span className="text-[12px] font-bold text-[#ddd6fe] uppercase tracking-widest">NOTE AI RECRUITER</span>
          <p className="text-white text-[14px] font-medium italic leading-[22px] m-0 z-10">
            &ldquo;{candidates.length === 0
              ? 'No applications for the moment.'
              : avgScore >= 70
                ? `Good candidate quality. Average score of ${avgScore}% — recommend a 75% threshold.`
                : `Candidate pool needs improvement. Average score of ${avgScore}% — broaden your criteria.`
            }&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}
