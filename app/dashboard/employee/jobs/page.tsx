'use client'

import { SearchOutlined, BankOutlined, EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Input, message } from 'antd'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getAllJobs } from '@/lib/jobService'
import { getUserCandidatures } from '@/lib/candidatureService'
import type { Job } from '@/lib/database.types'

export default function EmployeeJobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [appliedJobsStatus, setAppliedJobsStatus] = useState<Map<string, string>>(new Map())
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

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
    if (!user) return messageApi.error("Vous devez être connecté pour postuler.")
    // For employees, we stay in the employee dashboard
    router.push(`/dashboard/employee/profile?applyTo=${jobId}`)
  }

  const categories = ['Tous les postes', ...Array.from(new Set(jobs.map(j => j.category)))]
  const [activeTab, setActiveTab] = useState('Tous les postes')

  const filteredJobs = (activeTab === 'Tous les postes' ? jobs : jobs.filter(j => j.category === activeTab))
    .filter(job => {
      const status = appliedJobsStatus.get(job.id)
      return status !== 'rejected' && status !== 'accepted'
    })

  return (
    <div className="p-[28px]">
      {contextHolder}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Jobs Marketplace</h1>
        <p className="text-[#475467] text-sm mt-1">Discover opportunities and grow your career internally.</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-8 max-w-2xl">
        <Input
          prefix={<SearchOutlined className="text-[#98A2B3]" />}
          placeholder="Search by title, department..."
          size="large"
          className="rounded-xl"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {categories.map((f) => (
          <button
            key={f}
            onClick={() => setActiveTab(f)}
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
        <div className="text-center py-24 text-slate-400">Loading jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-[60px] text-center">
            <h2 className="text-xl font-bold text-[#101828] mb-2">No jobs available right now</h2>
            <p className="text-[#475467] text-sm max-w-xs mx-auto">Check back later for new internal positions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => {
            const candidatureStatus = appliedJobsStatus.get(job.id)
            const hasApplied = !!candidatureStatus
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-[#E4E7EC] p-6 text-left shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-[16px] font-bold text-[#101828] mb-1">{job.title}</h3>
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
                    <ClockCircleOutlined /> Deadline : <span className="font-semibold text-gray-800">{new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                  
                  {hasApplied ? (
                    <button disabled className="w-full py-2.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 font-medium text-sm flex items-center justify-center gap-2">
                       <CheckCircleOutlined /> Application Sent
                    </button>
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
      )}
    </div>
  )
}
