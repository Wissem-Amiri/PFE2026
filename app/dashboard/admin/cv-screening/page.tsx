'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { message, Modal, Spin, Select } from 'antd'
import { 
  HiOutlineDocumentSearch, 
  HiOutlineEye, 
  HiOutlineSearch, 
  HiOutlineRefresh, 
  HiOutlineTrash,
  HiOutlineLightningBolt,
  HiOutlineFilter,
  HiOutlineChartPie,
  HiOutlineTrendingUp,
  HiOutlineChatAlt2,
  HiOutlineArrowNarrowRight
} from 'react-icons/hi'
import { useApplications, queryKeys, useJobs } from '@/lib/hooks'
import { analyzeApplication, hardDeleteApplications } from '@/app/api/applications'
import { useQueryClient } from '@tanstack/react-query'

export default function CVScreeningPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const [search, setSearch] = useState('')
  const [scoreFilter, setScoreFilter] = useState('All Scores')
  const [expFilter, setExpFilter] = useState('All Levels')
  const [selectedJobId, setSelectedJobId] = useState('all')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [analyzedApps, setAnalyzedApps] = useState<Record<string, { score: number; analysis: any }>>({})  

  const { data: jobsResult } = useJobs({ page: 1, pageSize: 100 })
  const jobs = jobsResult?.data || []

  // Map score filter to numeric ranges
  const scoreRange = useMemo(() => {
    if (scoreFilter === 'High (>= 80%)') return { min: 80, max: 100 }
    if (scoreFilter === 'Medium (50% - 79%)') return { min: 50, max: 79 }
    if (scoreFilter === 'Low (< 50%)') return { min: 0, max: 49 }
    return { min: undefined, max: undefined }
  }, [scoreFilter])

  const expRange = useMemo(() => {
    if (expFilter === 'Expert (> 5 Years)') return { min: 61, max: 999 }
    if (expFilter === 'Senior (2 - 5 Years)') return { min: 24, max: 60 }
    if (expFilter === 'Junior (< 2 Years)') return { min: 0, max: 23 }
    return { min: undefined, max: undefined }
  }, [expFilter])

  const { data: result, isLoading: loading } = useApplications({
    page: currentPage,
    pageSize,
    showArchived: false,
    status: 'pending', 
    search: search,
    minScore: scoreRange.min,
    maxScore: scoreRange.max,
    minExperience: expRange.min,
    maxExperience: expRange.max,
    jobId: selectedJobId
  })

  const applications = result?.data || []
  const totalItems = result?.count || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  // ─── AI LOGIC ───
  const handleAnalyze = async (application: any) => {
    setAnalyzingId(application.id)
    const hide = message.loading(`AI is scanning ${application.candidate?.user?.user_name}'s profile...`, 0)
    try {
      const { data, error } = await analyzeApplication(application.id)
      if (error) throw new Error(error)
      setAnalyzedApps(prev => ({ ...prev, [application.id]: { score: data?.score ?? 0, analysis: data } }))
      message.success(`Analysis ready for ${application.candidate?.user?.user_name}!`)
      queryClient.invalidateQueries({ queryKey: queryKeys.applications })
      setSelectedAnalysis(data)
      setIsReportModalOpen(true)
    } catch (error: any) {
      message.error(`Analysis failed: ${error.message}`)
    } finally {
      hide(); setAnalyzingId(null)
    }
  }

  const handleBulkDelete = async () => {
    Modal.confirm({
      title: 'Permanent Removal',
      content: `Are you sure you want to permanently remove ${selectedIds.length} candidate(s)? This cannot be undone.`,
      okText: 'Remove', okType: 'danger', centered: true,
      onOk: async () => {
        setIsDeleting(true)
        try {
          const { error } = await hardDeleteApplications(selectedIds)
          if (error) throw error
          message.success('Candidates removed permanently')
          setSelectedIds([]); queryClient.invalidateQueries({ queryKey: queryKeys.applications })
        } catch (err: any) {
          message.error(`Removal failed: ${err.message}`)
        } finally { setIsDeleting(false) }
      }
    })
  }

  // ─── UI HELPERS ───
  const getScoreColor = (score: number) => {
    if (score >= 80) return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' }
    if (score >= 50) return { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' }
    return { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' }
  }

  const getStrengthColor = (index: number) => {
    const colors = [
      'bg-purple-50 text-purple-600 border-purple-100',
      'bg-cyan-50 text-cyan-600 border-cyan-100',
      'bg-amber-50 text-amber-600 border-amber-100',
      'bg-emerald-50 text-emerald-600 border-emerald-100'
    ]
    return colors[index % colors.length]
  }

  // Analytics Calculation
  const stats = useMemo(() => {
    if (!applications.length) return { avg: 0, topSkills: [] }
    const scored = applications.filter(a => a.match_score !== null)
    const avg = scored.length ? Math.round(scored.reduce((acc, a) => acc + (a.match_score || 0), 0) / scored.length) : 0
    
    // Calculate Dynamic Skill Saturation
    const skillCounts: Record<string, number> = {}
    scored.forEach(app => {
      const strengths = app.ai_analysis?.strengths || []
      strengths.forEach((s: string) => {
        skillCounts[s] = (skillCounts[s] || 0) + 1
      })
    })

    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / scored.length) * 100)
      }))

    return { avg, topSkills }
  }, [applications])

  return (
    <div className="flex-1 bg-[#F9FAFB] flex flex-col font-['Inter',sans-serif] min-w-0">
      
      {/* ── HEADER SECTION ── */}
      <div className="px-8 pt-8 pb-6 bg-white border-b border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight">AI Screening Dashboard</h1>
            <p className="text-gray-500 text-[14px]">
              {selectedJobId === 'all' 
                ? `Reviewing ${totalItems} applicants across all positions`
                : `Reviewing ${totalItems} applicants for this role`
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
             {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="h-10 px-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 font-semibold text-[13px] flex items-center gap-2 hover:bg-rose-100 transition-all"
                >
                  <HiOutlineTrash size={16} /> Delete ({selectedIds.length})
                </button>
             )}
          </div>
        </div>

        {/* ── FILTERS SECTION ── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm min-w-[240px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Position:</span>
              <Select 
                value={selectedJobId}
                onChange={(val) => { setSelectedJobId(val); setCurrentPage(1); }}
                variant="borderless" 
                className="flex-1 text-[13px] font-semibold"
                popupMatchSelectWidth={false}
                options={[
                  { value: 'all', label: 'All Positions' },
                  ...jobs.map(j => ({ value: j.id, label: j.title }))
                ]}
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm min-w-[200px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score:</span>
              <Select 
                value={scoreFilter}
                onChange={(val) => { setScoreFilter(val); setCurrentPage(1); }}
                variant="borderless" 
                className="flex-1 text-[13px] font-semibold"
                popupMatchSelectWidth={false}
                options={[
                  { value: 'All Scores', label: 'All Scores' },
                  { value: 'High (>= 80%)', label: 'High (>= 80%)' },
                  { value: 'Medium (50% - 79%)', label: 'Medium (50% - 79%)' },
                  { value: 'Low (< 50%)', label: 'Low (< 50%)' }
                ]}
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm min-w-[200px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exp:</span>
              <Select 
                value={expFilter}
                onChange={(val) => { setExpFilter(val); setCurrentPage(1); }}
                variant="borderless" 
                className="flex-1 text-[13px] font-semibold"
                popupMatchSelectWidth={false}
                options={[
                  { value: 'All Levels', label: 'All Levels' },
                  { value: 'Expert (> 5 Years)', label: 'Expert (> 5 Years)' },
                  { value: 'Senior (2 - 5 Years)', label: 'Senior (2 - 5 Years)' },
                  { value: 'Junior (< 2 Years)', label: 'Junior (< 2 Years)' }
                ]}
              />
            </div>

            <div className="flex-1" /> {/* Spacer */}

            {/* Compact AI Status */}
            <div className="bg-gradient-to-r from-[#7F56D9] to-[#6941C6] rounded-xl px-4 py-2 flex items-center gap-4 shadow-md shadow-purple-100">
               <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-purple-200 uppercase tracking-widest">AI Status</span>
                 <span className="text-white font-bold text-[13px]">Active Screening</span>
               </div>
               <div className="h-6 w-px bg-white/20" />
               <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-lg">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                 <span className="text-white text-[10px] font-bold tracking-wider uppercase">Live</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN TABLE SECTION ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                <th className="pl-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={applications.length > 0 && selectedIds.length === applications.length}
                    onChange={() => setSelectedIds(selectedIds.length === applications.length ? [] : applications.map(a => a.id))}
                    className="w-4 h-4 rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Candidate</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">AI Match Score</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Key Strengths</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Experience</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-24"><Spin size="large" /></td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-24 text-gray-400">No applications to review</td></tr>
              ) : (
                applications.map((app) => {
                  const localRes = analyzedApps[app.id]
                  const score = localRes?.score ?? app.match_score
                  const analysis = localRes?.analysis ?? app.ai_analysis
                  const isAnalyzed = score !== null && analysis && Object.keys(analysis).length > 0
                  const colors = getScoreColor(score || 0)

                  return (
                    <tr key={app.id} className={`group hover:bg-gray-50/50 transition-colors ${selectedIds.includes(app.id) ? 'bg-[#F9F5FF]' : score >= 80 ? 'bg-emerald-50/40' : ''}`}>
                      <td className="pl-6 py-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(app.id)}
                          onChange={() => setSelectedIds(prev => prev.includes(app.id) ? prev.filter(i => i !== app.id) : [...prev, app.id])}
                          className="w-4 h-4 rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white">
                            {app.candidate?.user?.avatar_url ? (
                              <img src={app.candidate.user.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-[12px]">
                                {app.candidate?.user?.user_name?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900 leading-none mb-1">{app.candidate?.user?.user_name || 'Anonymous'}</p>
                            <p className="text-[12px] text-gray-400 mb-1">{app.candidate?.user?.email || 'no-email@example.com'}</p>
                            <p className="text-[10px] text-[#7F56D9] font-semibold bg-purple-50 px-2 py-0.5 rounded inline-block">
                              Job: {app.job?.title || 'Unknown Job'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {isAnalyzed ? (
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-[14px] ${colors.bg} ${colors.border} ${colors.text}`}>
                            {score}%
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed border-gray-100 text-gray-300 text-[10px] font-bold">
                            PENDING
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {isAnalyzed && Array.isArray(analysis.strengths) ? (
                            analysis.strengths.slice(0, 3).map((s: string, i: number) => (
                              <span key={i} className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getStrengthColor(i)}`}>
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-300 text-[12px] italic">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           {(() => {
                             if (!isAnalyzed || !analysis.experience_list) return <span className="text-[13px] font-bold text-gray-700">0 Years</span>

                             // Helper to parse duration string to total months
                             const parseToMonths = (str: string) => {
                               const years = parseInt(str.match(/(\d+)\s*(?:an|yr|year)/i)?.[1] || '0')
                               const months = parseInt(str.match(/(\d+)\s*(?:moi|mon)/i)?.[1] || '0')
                               return (years * 12) + months
                             }

                             // Helper to format months back to string
                             const formatMonths = (total: number) => {
                               const y = Math.floor(total / 12)
                               const m = total % 12
                               const yStr = y > 0 ? `${y} an${y > 1 ? 's' : ''}` : ''
                               const mStr = m > 0 ? `${m} mois` : ''
                               return [yStr, mStr].filter(Boolean).join(' ') || '0 mois'
                             }

                             // Group by role
                             const grouped: Record<string, number> = {}
                             analysis.experience_list.forEach((exp: any) => {
                               const role = exp.role.toLowerCase().trim()
                               const months = parseToMonths(exp.duration)
                               grouped[role] = (grouped[role] || 0) + months
                             })

                             // Show the most relevant one (usually the first one in grouped keys)
                             const firstRole = Object.keys(grouped)[0]
                             if (!firstRole) return <span className="text-[13px] font-bold text-gray-700">0 Years</span>
                             
                             return (
                               <>
                                 <span className="text-[13px] font-bold text-gray-700">
                                   {formatMonths(grouped[firstRole])}
                                 </span>
                                 <span className="text-[11px] text-gray-400 truncate max-w-[120px] capitalize">
                                   Role: {firstRole}
                                 </span>
                               </>
                             )
                           })()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end items-center gap-2">
                           {isAnalyzed ? (
                             <>
                               <button 
                                 onClick={() => { setSelectedAnalysis(analysis); setIsReportModalOpen(true); }}
                                 className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-[#F9F5FF] hover:text-[#7F56D9] transition-all border border-transparent hover:border-[#D6BBFB]"
                                 title="View Report"
                               >
                                 <HiOutlineEye size={18} />
                               </button>
                               <button 
                                 onClick={() => handleAnalyze(app)}
                                 disabled={analyzingId === app.id}
                                 className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all border border-transparent"
                                 title="Re-analyze"
                               >
                                 {analyzingId === app.id ? <Spin size="small" /> : <HiOutlineRefresh size={18} />}
                               </button>
                               <button 
                                 onClick={() => router.push(`/dashboard/admin/registrations?highlight=${encodeURIComponent(app.candidate?.user?.email || '')}`)}
                                 className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-transparent"
                                 title="Finalize Registration"
                               >
                                 <HiOutlineArrowNarrowRight size={18} />
                               </button>
                             </>
                           ) : (
                             <button
                               onClick={() => handleAnalyze(app)}
                               disabled={analyzingId === app.id}
                               className="px-4 h-9 bg-[#7F56D9] text-white rounded-lg font-bold text-[12px] hover:bg-[#6941C6] transition-all flex items-center gap-2"
                             >
                               {analyzingId === app.id ? <Spin size="small" className="brightness-200" /> : <HiOutlineLightningBolt size={14} />}
                               {analyzingId === app.id ? 'Analyzing' : 'Analyse'}
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center">
              <p className="text-[13px] text-gray-400">Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results</p>
              <div className="flex items-center gap-1">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 disabled:text-gray-200 hover:bg-gray-50 transition-all"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-md font-bold text-[12px] transition-all ${currentPage === page ? 'bg-[#7F56D9] text-white' : 'border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 disabled:text-gray-200 hover:bg-gray-50 transition-all"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── ANALYTICS FOOTER ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#7F56D9]"><HiOutlineChartPie size={18} /></div>
              <h4 className="text-[14px] font-bold text-gray-900 uppercase tracking-wider">Skill Saturation</h4>
            </div>
            <div className="space-y-4">
              {stats.topSkills.length > 0 ? (
                stats.topSkills.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[12px] font-bold mb-1.5">
                      <span className="text-gray-700">{s.name}</span>
                      <span className="text-gray-400">{s.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#7F56D9] rounded-full transition-all duration-500" style={{ width: `${s.percentage}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-[12px]">No skill data available yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><HiOutlineTrendingUp size={18} /></div>
              <h4 className="text-[14px] font-bold text-gray-900 uppercase tracking-wider">Average AI Score</h4>
            </div>
            <div className="text-center py-4">
              <h2 className="text-[42px] font-bold text-gray-900 leading-none">{stats.avg}%</h2>
              <p className="text-emerald-500 text-[12px] font-bold mt-2">+4.2% vs. last role</p>
            </div>
            <div className="h-12 w-full bg-emerald-50/50 rounded-xl flex items-end gap-1 px-4 py-2">
               {[40, 60, 50, 70, 90, 80, 85].map((h, i) => (
                 <div key={i} className="flex-1 bg-emerald-400/30 rounded-t-sm" style={{ height: `${h}%` }}></div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── REPORT MODAL ── */}
      <Modal
        title={null}
        open={isReportModalOpen}
        onCancel={() => setIsReportModalOpen(false)}
        footer={null}
        width={700}
        centered
        className="ai-report-modal"
      >
        {selectedAnalysis ? (
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[24px] font-bold text-[#101828] mb-1">AI Analysis Report</h2>
                <p className="text-[#667085] text-[14px]">Detailed screening results for the candidate.</p>
              </div>
              <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 font-bold ${getScoreColor(selectedAnalysis.score || 0).bg} ${getScoreColor(selectedAnalysis.score || 0).border} ${getScoreColor(selectedAnalysis.score || 0).text}`}>
                <span className="text-[10px] uppercase opacity-60">Score</span>
                <span className="text-[28px] leading-none">{selectedAnalysis.score || 0}%</span>
              </div>
            </div>

            <div className="space-y-8">
              {/* Strengths */}
              <section>
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#101828] mb-4">
                  <HiOutlineLightningBolt className="text-[#7F56D9] text-xl" />
                  Key Strengths
                </h3>
                <div className="bg-purple-50/30 rounded-xl p-5 border border-purple-100">
                   {Array.isArray(selectedAnalysis.strengths) ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.strengths.map((s: string, i: number) => (
                           <span key={i} className="px-3 py-1 bg-white border border-purple-100 text-purple-600 rounded-lg text-[13px] font-semibold">
                             {s}
                           </span>
                        ))}
                      </div>
                   ) : (
                      <p className="text-[14px] text-[#344054] m-0">{selectedAnalysis.strengths || 'No specific strengths listed.'}</p>
                   )}
                </div>
              </section>

              {/* Experience */}
              <section>
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#101828] mb-4">
                  <HiOutlineTrendingUp className="text-emerald-500 text-xl" />
                  Experience Match
                </h3>
                <div className="bg-emerald-50/30 rounded-xl p-5 border border-emerald-100">
                   {Array.isArray(selectedAnalysis.experience_list) ? (
                      <div className="space-y-3">
                         {selectedAnalysis.experience_list.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-emerald-100 last:border-0">
                               <span className="text-[14px] font-semibold text-gray-700">{item.role}</span>
                               <span className="text-[12px] bg-white px-3 py-1 rounded-full border border-emerald-100 text-emerald-600 font-bold">
                                 {item.duration}
                               </span>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <p className="text-[14px] text-[#344054] leading-relaxed m-0">
                        {selectedAnalysis.experience_relevance || selectedAnalysis.experience || 'No detailed experience match provided.'}
                      </p>
                   )}
                </div>
              </section>

              {/* Weaknesses */}
              {selectedAnalysis.areas_for_improvement && (
                <section>
                  <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#101828] mb-4">
                    <HiOutlineExclamationCircle className="text-amber-500 text-xl" />
                    Areas for Improvement
                  </h3>
                  <div className="bg-amber-50/30 rounded-xl p-5 border border-amber-100">
                     <p className="text-[14px] text-[#344054] leading-relaxed m-0">
                       {selectedAnalysis.areas_for_improvement}
                     </p>
                  </div>
                </section>
              )}
            </div>

            <div className="mt-10 flex justify-end">
               <button 
                 onClick={() => setIsReportModalOpen(false)}
                 className="px-8 h-11 rounded-xl bg-[#7F56D9] text-white font-bold hover:bg-[#6941C6] transition-all shadow-lg shadow-[#7F56D9]/20"
               >
                 Close Report
               </button>
            </div>
          </div>
        ) : (
          <div className="p-20 text-center"><Spin /></div>
        )}
      </Modal>

      <style jsx global>{`
        .ai-report-modal .ant-modal-content {
          border-radius: 32px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .ant-select-selector {
           padding: 0 !important;
        }
        .ant-select-selection-item {
           color: #101828 !important;
           font-weight: 700 !important;
        }
      `}</style>
    </div>
  )
}

