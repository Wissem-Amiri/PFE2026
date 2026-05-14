'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isJobOpen } from '@/app/api/job'
import { useInView } from 'react-intersection-observer'
import type { Job } from '@/lib/database.types'
import { message } from 'antd'

import dayjs from 'dayjs'

export default function JobOverviewPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'brief' | 'members'>('brief')
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const { ref, inView } = useInView()
  const PAGE_SIZE = 8

  useEffect(() => {
    async function loadJob() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error || !data) {
        messageApi.error("Unable to load the job offer.")
        setTimeout(() => router.push('/dashboard/admin/jobs'), 1500)
      } else {
        setJob(data as Job)
      }
      setLoading(false)
    }
    loadJob()
  }, [jobId, router, messageApi])

  useEffect(() => {
    if (activeTab === 'members' && job) {
      loadMembers(0)
    }
  }, [activeTab, job, searchQuery])

  useEffect(() => {
    if (inView && hasMore && !loadingMembers && activeTab === 'members' && page >= 0) {
      loadMembers(page + 1)
    }
  }, [inView, hasMore, loadingMembers, activeTab])

  async function loadMembers(pageToLoad = 0) {
    if (pageToLoad === 0) {
      setMembers([])
      setPage(0)
      setHasMore(true)
    }

    setLoadingMembers(true)
    const from = pageToLoad * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('employee')
      .select('*, users!inner(*)')
      .ilike('position', job?.title || '')
      .range(from, to)
    
    if (searchQuery) {
      query = query.ilike('users.user_name', `%${searchQuery}%`)
    }

    const { data, error } = await query
    
    if (!error && data) {
      setMembers(prev => pageToLoad === 0 ? data : [...prev, ...data])
      setPage(pageToLoad)
      if (data.length < PAGE_SIZE) setHasMore(false)
    }
    setLoadingMembers(false)
  }





  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>
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
          {activeTab === 'members' && (
            <div className="relative group">
              <svg 
                className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#98A2B3] group-focus-within:text-[#7C3AED] transition-colors" 
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text"
                placeholder="Search member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-[36px] pr-[16px] py-[10px] rounded-[8px] border border-[#D0D5DD] bg-white text-[#101828] text-[14px] outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all w-[240px] placeholder:text-[#98A2B3]"
              />
            </div>
          )}
          

        </div>
      </div>

      {/* Overview subtitles */}
      <div className="mb-[24px]">
        <div className="flex justify-between items-center mb-[8px]">
          <h2 className="text-[20px] font-semibold text-[#101828] m-0">Job overview</h2>
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
          {/* Details */}
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-[18px] font-semibold text-[#101828] mb-[16px]">About the Job</h3>
              <div className="text-[#475467] text-[15px] leading-[1.7]">
                <p className="mb-4">
                  {job.description}
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Position Category: <span className="font-medium text-[#101828]">{job.category}</span></li>
                  <li>Available Seats: <span className="font-medium text-[#101828]">{job.open_seats}</span></li>
                  <li>Offer Status: {isJobOpen(job) ? <span className="text-green-600 font-medium">Open</span> : <span className="text-red-500 font-medium">Closed</span>}</li>
                  <li>Application Deadline: <span className="font-medium text-[#101828]">{new Date(job.deadline).toLocaleDateString()}</span></li>
                </ul>
              </div>
            </div>

            {job.requirements && (
              <div>
                <h3 className="text-[18px] font-semibold text-[#101828] mb-[16px]">Requirements</h3>
                <ul className="list-disc pl-5 space-y-3 m-0">
                  {job.requirements.split('\n').filter(r => r.trim()).map((req, i) => (
                    <li key={i} className="text-[#475467] text-[15px] leading-[1.5]">
                      {req.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}


      {activeTab === 'members' && (
        <div className="max-w-4xl">
          {loadingMembers ? (
            <div className="py-10 text-center text-gray-500">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <p>No members assigned to this position yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div key={member.id} className="bg-white border border-[#eaecf0] rounded-[12px] p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className="w-[50px] h-[50px] rounded-full bg-[#f1f5f9] flex items-center justify-center overflow-hidden border border-[#e2e8f0]">
                    {member.users?.avatar_url ? (
                      <img src={member.users.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[16px] font-bold text-[#64748b]">
                        {member.users?.user_name?.substring(0, 2).toUpperCase() || 'EM'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[16px] font-semibold text-[#101828] m-0 truncate">
                      {member.users?.user_name || 'Anonymous'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider block">Joined</span>
                    <span className="text-[13px] font-medium text-[#101828]">
                      {member.hire_date ? new Date(member.hire_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Scroll Trigger */}
              <div ref={ref} className="col-span-full py-4 h-10" />
            </div>
          )}
        </div>
      )}

    </div>
  )
}
