'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { message, Modal, Spin, Tag } from 'antd'
import { HiOutlineDocumentSearch, HiOutlineEye, HiOutlineSearch, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi'
import { useApplications, queryKeys } from '@/lib/hooks'
import { analyzeApplication } from '@/app/api/applications'
import { useQueryClient } from '@tanstack/react-query'

export default function CVScreeningPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [search, setSearch] = useState('')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)

  // We reuse the applications hook to list pending/all applications
  const { data: result, isLoading: loading } = useApplications({
    page: currentPage,
    pageSize,
    showArchived: false,
    status: 'pending', 
    search: search
  })

  const applications = result?.data || []
  const totalItems = result?.count || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  const handleAnalyze = async (application: any) => {
    setAnalyzingId(application.id)
    const hide = message.loading(`Analyzing CV for ${application.candidate?.user?.user_name}...`, 0)
    
    try {
      const { data, error } = await analyzeApplication(application.id)
      
      if (error) throw new Error(error)
      
      message.success(`Analysis completed for ${application.candidate?.user?.user_name}!`)
      queryClient.invalidateQueries({ queryKey: queryKeys.applications })
      
      // Optionally show the report immediately
      setSelectedAnalysis(data)
      setIsReportModalOpen(true)
    } catch (error: any) {
      message.error(`Analysis failed: ${error.message}`)
    } finally {
      hide()
      setAnalyzingId(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100'
    return 'text-rose-600 bg-rose-50 border-rose-100'
  }

  return (
    <div className="flex-1 bg-[#f8fafc] flex flex-col font-['Inter',sans-serif] min-w-0">
      {/* ── HEADER ── */}
      <div className="bg-white px-4 md:px-[27px] py-4 md:py-[24px] border-b border-[#e2e8f0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <h1 className="text-[20px] font-bold text-[#0f172a] flex items-center gap-2">
          <HiOutlineDocumentSearch className="text-[#7f56d9] text-[24px]" />
          CV Screening
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-[32px] pb-[32px]">
        {/* ── DESCRIPTION ── */}
        <div className="mt-[32px] mb-[16px]">
          <p className="text-[14px] text-[#64748b] leading-[20px]">
            Analyze candidate CVs using AI to calculate their relevance score for the applied position.
          </p>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="bg-[rgba(248,248,248,0.31)] border border-[rgba(203,195,213,0.1)] rounded-[16px] p-4 mb-[16px]">
          <div className="w-full relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 text-gray-400">
              <HiOutlineSearch size={18} />
            </div>
            <input
              placeholder="Search candidate..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-[rgba(203,195,213,0.2)] rounded-[12px] pl-[41px] pr-[17px] py-[12px] text-[14px] text-[#101828] focus:outline-none focus:ring-1 focus:ring-[#7f56d9]/20 transition-all"
            />
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden w-full overflow-x-auto no-scrollbar">
          <div className="min-w-[1000px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[rgba(248,250,252,0.5)]">
                  <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">Candidate</th>
                  <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">Position Applied</th>
                  <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-center">AI Score</th>
                  <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-[60px] text-[#64748b]"><Spin /> Loading applications...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-[60px] text-[#64748b]">No candidates found.</td></tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#f8fafc]/50 transition-colors h-[74px]">
                      <td className="px-[24px] py-[16px]">
                        <div className="flex items-center gap-[12px]">
                          <div className="w-[40px] h-[40px] rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden">
                            {app.candidate?.user?.avatar_url ? (
                              <img src={app.candidate.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[12px] font-bold text-[#64748b]">
                                {app.candidate?.user?.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-semibold text-[#0f172a] truncate">
                              {app.candidate?.user?.user_name || 'Anonymous'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-[24px] py-[26px] text-[14px] text-[#475569] font-medium">
                        {app.job?.title || 'Unknown Position'}
                      </td>
                      <td className="px-[24px] py-[26px] text-[14px] text-center">
                        {app.match_score !== null ? (
                          <div 
                            className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-[16px] cursor-pointer hover:scale-110 transition-transform ${getScoreColor(app.match_score)}`}
                            onClick={() => {
                              setSelectedAnalysis(app.ai_analysis)
                              setIsReportModalOpen(true)
                            }}
                            title="Click to view full report"
                          >
                            {app.match_score}
                          </div>
                        ) : (
                          <span className="px-[10px] py-[4px] rounded-full bg-gray-100 text-gray-400 text-[12px] font-medium uppercase border border-gray-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-[24px] py-[16px]">
                        <div className="flex justify-start items-center gap-[8px]">
                          <button
                            onClick={() => handleAnalyze(app)}
                            disabled={analyzingId === app.id}
                            className={`h-[36px] px-[16px] rounded-[8px] font-semibold text-[13px] shadow-sm transition-all flex items-center gap-2
                              ${analyzingId === app.id 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-[#7f56d9] text-white hover:bg-[#6941c6]'}`}
                          >
                            {analyzingId === app.id ? <Spin size="small" /> : null}
                            {analyzingId === app.id ? 'Analyzing...' : 'Analyse'}
                          </button>
                          
                          {app.ai_analysis && (
                             <button
                               onClick={() => {
                                 setSelectedAnalysis(app.ai_analysis)
                                 setIsReportModalOpen(true)
                               }}
                               className="h-[36px] px-[12px] rounded-[8px] border border-[#7f56d9] text-[#7f56d9] hover:bg-[#f9f5ff] font-semibold text-[13px] transition-all"
                             >
                               Report
                             </button>
                          )}

                          {app.candidate?.resume_url && (
                            <a
                              href={app.candidate?.resume_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="w-[36px] h-[36px] rounded-[8px] border border-[#d0d5dd] text-[#344054] hover:bg-gray-50 flex items-center justify-center transition-all"
                              title="View original CV"
                            >
                              <HiOutlineEye size={18} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
              <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 font-bold ${getScoreColor(selectedAnalysis.score || 0)}`}>
                <span className="text-[10px] uppercase opacity-60">Score</span>
                <span className="text-[28px] leading-none">{selectedAnalysis.score || 0}</span>
              </div>
            </div>

            <div className="space-y-8">
              {/* Summary / Strengths */}
              <section>
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#101828] mb-4">
                  <HiOutlineCheckCircle className="text-emerald-500 text-xl" />
                  Key Strengths
                </h3>
                <div className="bg-emerald-50/30 rounded-xl p-5 border border-emerald-100">
                   {Array.isArray(selectedAnalysis.strengths) ? (
                      <ul className="space-y-2 m-0 pl-4 text-[14px] text-[#344054]">
                        {selectedAnalysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                   ) : (
                      <p className="text-[14px] text-[#344054] m-0">{selectedAnalysis.strengths || 'No specific strengths listed.'}</p>
                   )}
                </div>
              </section>

              {/* Experience Relevance */}
              <section>
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#101828] mb-4">
                  <HiOutlineDocumentSearch className="text-[#7f56d9] text-xl" />
                  Experience Match
                </h3>
                <div className="bg-[#f9f5ff]/30 rounded-xl p-5 border border-[#f4ebff]">
                   <p className="text-[14px] text-[#344054] leading-relaxed m-0">
                     {selectedAnalysis.experience_relevance || selectedAnalysis.experience || 'No detailed experience match provided.'}
                   </p>
                </div>
              </section>

              {/* Suggestions / Weaknesses if any */}
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
                 className="px-6 h-[44px] rounded-xl bg-[#7f56d9] text-white font-bold hover:bg-[#6941c6] transition-all shadow-md shadow-[#7f56d9]/20"
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
          border-radius: 24px !important;
          padding: 0 !important;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

