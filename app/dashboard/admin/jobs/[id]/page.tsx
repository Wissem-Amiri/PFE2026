'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/api/supabase'
import { getJobApplications, updateCandidatureStatus, deleteAllOtherCandidatures } from '@/api/candidatures'
import { updateUserStatus } from '@/api/profile'
import { decrementJobSeats, isJobOpen } from '@/api/job'
import type { Job } from '@/api/database.types'
import { message, Table, Tag, Space, Avatar, Button as AntButton, Modal } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons'

export default function JobOverviewPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'brief' | 'applications' | 'members'>('brief')
  const [applications, setApplications] = useState<any[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    async function loadJob() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error || !data) {
        messageApi.error("Impossible de charger l'offre.")
        setTimeout(() => router.push('/dashboard/admin/jobs'), 1500)
      } else {
        setJob(data as Job)
      }
      setLoading(false)
    }
    loadJob()
  }, [jobId, router, messageApi])

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications()
    }
  }, [activeTab, jobId])

  async function loadApplications() {
    setLoadingApps(true)
    const { data, error } = await getJobApplications(jobId)
    if (!error) {
      setApplications(data || [])
    }
    setLoadingApps(false)
  }

  const handleStatusUpdate = async (application: any, status: 'accepted' | 'rejected') => {
    Modal.confirm({
      title: `${status === 'accepted' ? 'Accept' : 'Reject'} Application?`,
      content: `Are you sure you want to ${status} this candidate for this specific job position?`,
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        const { error } = await updateCandidatureStatus(application.id, status)
        if (!error) {
          if (status === 'accepted') {
            // Simple transition: use defaults for hiring details
            await updateUserStatus(application.postulant_id, 'approved')
            await deleteAllOtherCandidatures(application.postulant_id, application.id)
            await decrementJobSeats(jobId)
            
            // Reload job details to see new available seats
            const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single()
            if (data) setJob(data as Job)
          }
          messageApi.success(`Candidature ${status} successfully`)
          loadApplications()
        } else {
          messageApi.error("Failed to update status")
        }
      }
    })
  }

  const columns = [
    {
      title: 'Candidate',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <Space>
          <Avatar src={user?.avatar_url} icon={<UserOutlined />} />
          <div>
            <div className="font-medium text-[#101828]">{user?.user_name || 'Anonymous'}</div>
            <div className="text-[12px] text-gray-500">{user?.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Applied At',
      dataIndex: 'applied_at',
      key: 'applied_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'gold'
        if (status === 'accepted') color = 'green'
        if (status === 'rejected') color = 'red'
        return <Tag color={color}>{status.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <AntButton 
            type="text" 
            icon={<CheckCircleOutlined className="text-green-500" />} 
            onClick={() => handleStatusUpdate(record, 'accepted')}
            disabled={record.status === 'accepted'}
          />
          <AntButton 
            type="text" 
            icon={<CloseCircleOutlined className="text-red-500" />} 
            onClick={() => handleStatusUpdate(record, 'rejected')}
            disabled={record.status === 'rejected'}
          />
        </Space>
      ),
    },
  ]

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Chargement...</div>
  }

  if (!job) {
    return null
  }

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto bg-white">
      {contextHolder}
      
      {/* Top action */}
      <div className="mb-[24px]">
        <button 
          onClick={() => router.push('/dashboard/admin/jobs')}
          className="flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] border border-[#D0D5DD] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Go Back
        </button>
      </div>

      {/* Main Header */}
      <div className="flex justify-between items-center mb-[40px]">
        <div className="flex items-center gap-[24px]">
          {job.job_picture ? (
            <img 
              src={job.job_picture} 
              alt="Logo" 
              className="w-[80px] h-[80px] rounded-full object-cover border border-gray-100 shadow-sm"
            />
          ) : (
            <div className="w-[80px] h-[80px] rounded-full bg-[#4F46E5] flex-shrink-0"></div>
          )}
          <h1 className="text-[32px] font-bold text-[#101828] m-0">{job.title}</h1>
        </div>
        
        <div className="flex items-center gap-[12px]">
          <button className="w-[40px] h-[40px] rounded-[8px] border border-[#D0D5DD] bg-white flex items-center justify-center text-[#475467] cursor-pointer hover:bg-gray-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className="px-[20px] py-[10px] rounded-[8px] bg-[#7C3AED] text-white font-medium text-[14px] cursor-pointer hover:bg-[#6D28D9] transition-colors border-none shadow-sm flex items-center gap-[8px]"
          >
            <span>+</span> View Applications
          </button>
        </div>
      </div>

      {/* Overview subtitles */}
      <div className="mb-[24px]">
        <div className="flex justify-between items-center mb-[8px]">
          <h2 className="text-[20px] font-semibold text-[#101828] m-0">Job overview</h2>
          <button className="text-[#98A2B3] bg-transparent border-none cursor-pointer hover:text-[#475467]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
        <p className="text-[#475467] text-[15px] max-w-3xl line-clamp-2 m-0">
          {job.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-[16px] mb-[32px] border-b border-[#F2F4F7] pb-[16px]">
        <button 
          onClick={() => setActiveTab('brief')}
          className={`px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium transition-colors border-none cursor-pointer ${
            activeTab === 'brief' 
            ? 'bg-[#F5F3FF] text-[#7C3AED]' 
            : 'bg-transparent text-[#475467] hover:bg-gray-50'
          }`}
        >
          Job brief
        </button>
        <button 
          onClick={() => setActiveTab('applications')}
          className={`px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium transition-colors border-none cursor-pointer ${
            activeTab === 'applications' 
            ? 'bg-[#F5F3FF] text-[#7C3AED]' 
            : 'bg-transparent text-[#475467] hover:bg-gray-50'
          }`}
        >
          Applications
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`px-[16px] py-[8px] rounded-[8px] text-[14px] font-medium transition-colors border-none cursor-pointer ${
            activeTab === 'members' 
            ? 'bg-[#F5F3FF] text-[#7C3AED]' 
            : 'bg-transparent text-[#475467] hover:bg-gray-50'
          }`}
        >
          Members
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'brief' && (
        <div className="max-w-4xl">
          {/* Highlight Box */}
          <div className="bg-[#F9F5FF] p-[24px] rounded-[12px] mb-[40px]">
            <p className="text-[#7C3AED] text-[16px] leading-[1.6] m-0">
              Bienvenue sur la description détaillée du poste <b>{job.title}</b>. En tant qu'administrateur, vous pouvez visualiser et gérer les informations de ce recrutement depuis cet espace. Les candidatures reçues pour cette offre peuvent être auditées dans la section réservée.
            </p>
          </div>

          {/* Details */}
          <div>
            <h3 className="text-[18px] font-semibold text-[#101828] mb-[16px]">About the Job</h3>
            <div className="text-[#475467] text-[15px] leading-[1.7]">
              <p className="mb-4">
                {job.description}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Catégorie du poste : <span className="font-medium text-[#101828]">{job.category}</span></li>
                <li>Places disponibles : <span className="font-medium text-[#101828]">{job.open_seats}</span></li>
                <li>Statut de l'offre : {isJobOpen(job) ? <span className="text-green-600 font-medium">Ouverte</span> : <span className="text-red-500 font-medium">Fermée</span>}</li>
                <li>Clôture des candidatures : <span className="font-medium text-[#101828]">{new Date(job.deadline).toLocaleDateString()}</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="max-w-6xl">
          <Table 
            dataSource={applications} 
            columns={columns} 
            rowKey="id" 
            loading={loadingApps}
            pagination={{ pageSize: 10 }}
            className="border border-[#F2F4F7] rounded-xl overflow-hidden"
          />
        </div>
      )}

      {activeTab === 'members' && (
        <div className="max-w-4xl py-10 text-center text-gray-500">
          <p>Aucun membre affecté pour le moment.</p>
        </div>
      )}

    </div>
  )
}
