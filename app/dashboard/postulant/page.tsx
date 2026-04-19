'use client'

import { SearchOutlined, BankOutlined, EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Input, message } from 'antd'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/api/AuthContext'
import { getAllJobs } from '@/api/job'
import { getUserCandidatures } from '@/api/candidatures'
import type { Job } from '@/api/database.types'

export default function PostulantJobsPage() {
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
        // Fetch user candidatures to get their status per job
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
    router.push(`/dashboard/postulant/profile?applyTo=${jobId}`)
  }

  // Categories
  const categories = ['Tous les postes', ...Array.from(new Set(jobs.map(j => j.category)))]
  const [activeTab, setActiveTab] = useState('Tous les postes')

  const filteredJobs = (activeTab === 'Tous les postes' ? jobs : jobs.filter(j => j.category === activeTab))
    .filter(job => {
      const status = appliedJobsStatus.get(job.id)
      return status !== 'rejected' && status !== 'accepted'
    })

  return (
    <div>
      {contextHolder}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Offres d&apos;emploi</h1>
        <p className="text-[#475467] text-sm mt-1">Découvrez les postes disponibles et postulez en un clic.</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-8 max-w-2xl">
        <Input
          prefix={<SearchOutlined className="text-[#98A2B3]" />}
          placeholder="Rechercher un poste, département..."
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
        <div className="text-center py-24 text-slate-400">Recherche des offres...</div>
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
          <h2 className="text-xl font-bold text-[#101828] mb-2">Aucune offre pour le moment</h2>
          <p className="text-[#475467] text-sm max-w-xs leading-relaxed">
            Les offres d&apos;emploi publiées par l&apos;administrateur apparaîtront ici. Revenez bientôt !
          </p>
        </div>
      ) : (
        /* Jobs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => {
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
                    <ClockCircleOutlined /> Date limite : <span className="font-semibold text-gray-800">{new Date(job.deadline).toLocaleDateString()}</span>
                  </div>

                  {hasApplied ? (
                    candidatureStatus === 'rejected' ? (
                      <button disabled className="w-full py-2.5 rounded-xl border border-red-500 bg-red-50 text-red-700 font-medium text-sm flex items-center justify-center gap-2">
                        <CloseCircleOutlined /> Registration Rejected
                      </button>
                    ) : (
                      <button disabled className="w-full py-2.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 font-medium text-sm flex items-center justify-center gap-2">
                        <CheckCircleOutlined /> Candidature envoyée
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleApplyClick(job.id)}
                      className="w-full py-2.5 rounded-xl border border-[#7C3AED] bg-[#7C3AED] text-white font-medium text-sm hover:bg-[#6D28D9] transition-colors"
                    >
                      Postuler maintenant
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
