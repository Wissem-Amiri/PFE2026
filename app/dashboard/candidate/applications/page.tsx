'use client'

import { useAuth } from '@/api/AuthContext'
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import { useState, useEffect } from 'react'
import { getUserApplications } from '@/api/applications'

export default function CandidateApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadApplications() {
      if (user) {
        const { data } = await getUserApplications(user.id)
        setApplications(data ?? [])
      }
      setLoading(false)
    }
    loadApplications()
  }, [user])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return { label: 'Accepted', color: 'success', icon: <CheckCircleOutlined /> }
      case 'rejected':
        return { label: 'Rejected', color: 'error', icon: <CloseCircleOutlined /> }
      default:
        return { label: 'Pending', color: 'warning', icon: <ClockCircleOutlined /> }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">My Applications</h1>
        <p className="text-[#475467] text-sm mt-1">Track the status of your job applications.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#475467]">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm p-6 text-center text-[#475467]">
          You haven&apos;t applied to any job offers yet.
        </div>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {applications.map((app) => {
            const config = getStatusConfig(app.status)
            return (
              <div key={app.id} className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#101828] text-[16px] mb-1">{app.job?.title || 'Deleted offer'}</h3>
                  <div className="flex gap-2 items-center text-sm text-[#475467]">
                    <span className="font-medium">{app.job?.category}</span>
                    <span>•</span>
                    <span>Applied on {new Date(app.applied_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <div>
                  <Tag
                    color={config.color}
                    icon={config.icon}
                    className="text-[13px] px-3 py-1 rounded-lg font-semibold m-0"
                  >
                    {config.label}
                  </Tag>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
