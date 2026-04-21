'use client'

import { SearchOutlined, BankOutlined, EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Input, message } from 'antd'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/api/AuthContext'
import { getAllJobs } from '@/api/job'
import { getUserCandidatures } from '@/api/candidatures'
import type { Job } from '@/api/database.types'

const PAGE_SIZE = 8

export default function PostulantJobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [appliedJobsStatus, setAppliedJobsStatus] = useState<Map<string, string>>(new Map())
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('All positions')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadJobsAndStatus() {
      setLoading(true)
      const { data } = await getAllJobs()
      const openJobs = (data ?? []).filter(j => j.is_open)
      setJobs(openJobs)

      if (user) {
        const { data: candidatures } = await getUserCandidatures(user.id)
        const statusMap = new Map<string, string>()
        candidatures?.forEach(can => {
          statusMap.set(can.job_id, can.status)
        })
        setAppliedJobsStatus(statusMap)
      }
      setLoading(false)
    }

    loadJobsAndStatus()
  }, [user])

  const handleApplyClick = (jobId: string) => {
    if (!user) return messageApi.error("You must be logged in to apply.")
    router.push(`/dashboard/postulant/profile?applyTo=${jobId}`)
  }

  // Categories
  const categories = ['All positions', ...Array.from(new Set(jobs.map(j => j.category)))]

  const filteredJobs = (activeTab === 'All positions' ? jobs : jobs.filter(j => j.category === activeTab))
    .filter(job => {
      const status = appliedJobsStatus.get(job.id)
      return status !== 'rejected' && status !== 'accepted'
    })
    .filter(job => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return job.title.toLowerCase().includes(q) || job.category?.toLowerCase().includes(q)
    })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSearchQuery('')
  }

  return (
    <div>
      {contextHolder}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Job Offers</h1>
        <p className="text-[#475467] text-sm mt-1">Discover available positions and apply in one click.</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-8 max-w-2xl">
        <Input
          prefix={<SearchOutlined className="text-[#98A2B3]" />}
          placeholder="Search for a position, department..."
          size="large"
          className="rounded-xl"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1) 
          }}
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {categories.map((f) => (
          <button
            key={f}
            onClick={() => handleTabChange(f)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer
              ${activeTab === f
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                : 'bg-white text-[#475467] border-[#E4E7EC] hover:border-[#7C3AED]'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-24 text-slate-400">Searching for offers...</div>
      ) : filteredJobs.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-full bg-[#EDE9FE]/40 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#EDE9FE] flex items-center justify-center">
                <BankOutlined className="text-[#7C3AED] text-4xl" />
              </div>
            </div>
            <div className="absolute -top-2 -right-6 bg-white border border-[#E4E7EC] rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <EnvironmentOutlined className="text-[#7C3AED] text-xs" />
              <span className="text-[11px] font-medium text-[#475467]">Remote</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#101828] mb-2">No offers at the moment</h2>
          <p className="text-[#475467] text-sm max-w-xs leading-relaxed">
            Job offers published by the administrator will appear here. Check back soon!
          </p>
        </div>
      ) : (
        <>
          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedJobs.map(job => {
              const candidatureStatus = appliedJobsStatus.get(job.id)
              const hasApplied = !!candidatureStatus
              return (
                <div key={job.id} className="bg-white rounded-2xl border border-[#E4E7EC] p-6 text-left shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-[16px] font-bold text-[#101828] mb-1">{job.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[12px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {job.category}
                      </span>
                    </div>
                    <p className="text-[#475467] text-sm mb-6 line-clamp-3">
                      {job.description}
                    </p>
                  </div>
                  <div>
                    <div className="text-[12px] text-[#475467] mb-4 flex gap-1 items-center">
                      <ClockCircleOutlined /> Deadline: <span className="font-semibold text-gray-800">{new Date(job.deadline).toLocaleDateString()}</span>
                    </div>

                    {hasApplied ? (
                      candidatureStatus === 'rejected' ? (
                        <button disabled className="w-full py-2.5 rounded-xl border border-red-500 bg-red-50 text-red-700 font-medium text-sm flex items-center justify-center gap-2">
                          <CloseCircleOutlined /> Application Rejected
                        </button>
                      ) : (
                        <button disabled className="w-full py-2.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 font-medium text-sm flex items-center justify-center gap-2">
                          <CheckCircleOutlined /> Application Sent
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleApplyClick(job.id)}
                        className="w-full py-2.5 rounded-xl border border-[#7C3AED] bg-[#7C3AED] text-white font-medium text-sm hover:bg-[#6D28D9] transition-colors"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#EAECF0]">
              {/* Info */}
              <p className="text-[13px] text-[#667085]">
                Page <span className="font-semibold text-[#344054]">{currentPage}</span> of{' '}
                <span className="font-semibold text-[#344054]">{totalPages}</span>
                <span className="text-[#98A2B3]"> · {filteredJobs.length} offers</span>
              </p>

              {/* Controls */}
              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-[13px] font-medium transition-all cursor-pointer
                    ${currentPage === 1
                      ? 'border-[#EAECF0] text-[#D0D5DD] cursor-not-allowed bg-white'
                      : 'border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB] bg-white'
                    }`}
                >
                  <LeftOutlined className="text-[10px]" /> Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-[#98A2B3] text-[13px]">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`w-9 h-9 rounded-lg border text-[13px] font-medium transition-all cursor-pointer
                            ${currentPage === p
                              ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                              : 'bg-white text-[#344054] border-[#D0D5DD] hover:bg-[#F9FAFB]'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                </div>

                {/* Next */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-[13px] font-medium transition-all cursor-pointer
                    ${currentPage === totalPages
                      ? 'border-[#EAECF0] text-[#D0D5DD] cursor-not-allowed bg-white'
                      : 'border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB] bg-white'
                    }`}
                >
                  Next <RightOutlined className="text-[10px]" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
