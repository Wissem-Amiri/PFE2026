'use client'

import { useState, useEffect } from 'react'
import { Popconfirm, message, Tooltip } from 'antd'
import { getAllJobs, deleteJob } from '@/api/job'
import type { Job } from '@/api/database.types'
import Link from 'next/link'
import Image from 'next/image'

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('View all')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [messageApi, contextHolder] = message.useMessage()

  const fetchJobs = async () => {
    setLoading(true)
    const { data } = await getAllJobs()
    setJobs(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleDelete = async (id: string) => {
    const { error } = await deleteJob(id)
    if (error) {
      messageApi.error('Error deleting job')
    } else {
      messageApi.success('Job deleted successfully')
      fetchJobs()
    }
  }

  // Calculate dynamic tabs
  const categories = Array.from(new Set(jobs.map(j => j.category)))
  const tabs = [
    { label: 'View all', count: jobs.length },
    ...categories.map(cat => ({
      label: cat,
      count: jobs.filter(j => j.category === cat).length
    }))
  ]

  const filteredJobs = activeTab === 'View all' 
    ? jobs 
    : jobs.filter(j => j.category === activeTab)

  const handleCopyLink = (jobId: string) => {
    const link = `${window.location.origin}/jobs/${jobId}`
    navigator.clipboard.writeText(link)
    messageApi.success('Link copied to clipboard!')
  }

  return (
    <div className="flex-1 p-[32px] px-[40px] h-full overflow-y-auto bg-white font-['Inter',sans-serif]">
      {contextHolder}
      
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-[32px] mb-[32px]">
        <div className="flex flex-col gap-[20px]">
          <h1 className="text-[30px] font-semibold text-[#101828] tracking-tight m-0">Jobs</h1>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div className="space-y-1 max-w-[600px]">
                <h3 className="text-[18px] font-medium text-[#101828]">Jobs Title</h3>
                <p className="text-[14px] text-[#667085] leading-relaxed">
                  Manage and track your company's recruitment flow. Create new job openings, monitor application statuses, and build your dream team with our streamlined administrative interface.
                </p>
             </div>
             
             <Link 
               href="/dashboard/admin/jobs/createJob"
               className="inline-flex items-center gap-2 px-[16px] py-[10px] bg-[#7F56D9] text-white rounded-[8px] font-medium text-[14px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#6941C6] transition-all no-underline"
             >
               <img src="/assets/plus_white.svg" alt="" className="w-5 h-5" />
               Add Job
             </Link>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="relative flex gap-8 border-b border-[#EAECF0] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`pb-4 px-1 text-[14px] font-semibold relative transition-colors whitespace-nowrap ${
                activeTab === tab.label ? 'text-[#6941C6]' : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              {tab.label}
              {activeTab === tab.label && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6941C6] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <div className="w-8 h-8 border-4 border-[#F4EBFF] border-t-[#7950F2] rounded-full animate-spin mb-4" />
           <p className="text-[#667085] font-medium">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[100px] px-4 text-center border-2 border-dashed border-[#EAECF0] rounded-2xl">
           <div className="w-[48px] h-[48px] bg-[#F9FAFB] border border-[#EAECF0] rounded-[10px] flex items-center justify-center mb-4 shadow-sm">
              <img src="/assets/sidebar-jobs.svg" alt="" className="w-6 h-6 opacity-40" />
           </div>
           <h3 className="text-[16px] font-semibold text-[#101828] mb-1">No jobs found</h3>
           <p className="text-[14px] text-[#667085] max-w-[280px]">We couldn't find any jobs in the "{activeTab}" category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-[24px]">
          {filteredJobs.map(job => (
            <div 
              key={job.id} 
              className="group bg-white border border-[#EAECF0] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)] overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-1"
            >
              {/* Card Top: Logo & Actions */}
              <div className="p-[24px] pb-0 flex justify-between items-start">
                <div className="w-[48px] h-[48px] rounded-[10px] overflow-hidden bg-[#F9FAFB] border border-[#EAECF0] flex items-center justify-center">
                  {job.job_picture ? (
                    <img src={job.job_picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src="/assets/job_placeholder.svg" alt="" className="w-full h-full" />
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Tooltip title="Edit job">
                    <Link href={`/dashboard/admin/jobs/editJob/${job.id}`} className="p-1 mb-0.5 hover:bg-gray-50 rounded-md transition-colors no-underline">
                      <img src="/assets/jobs_edit.svg" alt="" className="w-[24px] h-[24px]" />
                    </Link>
                  </Tooltip>
                  <Tooltip title="Delete job">
                    <Popconfirm
                      title="Delete Job"
                      description="Are you sure you want to delete this job? This action cannot be undone."
                      onConfirm={() => handleDelete(job.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true, className: "bg-red-600 hover:bg-red-700 h-[36px] rounded-lg" }}
                      cancelButtonProps={{ className: "h-[36px] rounded-lg" }}
                    >
                      <button className="p-1 mb-0.5 hover:bg-red-50 rounded-md transition-colors">
                        <img src="/assets/jobs_delete.svg" alt="" className="w-[24px] h-[24px]" />
                      </button>
                    </Popconfirm>
                  </Tooltip>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-[24px] flex flex-col flex-1">
                <h3 className="text-[18px] font-semibold text-[#101828] mb-2 leading-[1.4] transition-colors group-hover:text-[#7F56D9]">
                  {job.title}
                </h3>
                
                <p className="text-[14px] text-[#667085] leading-relaxed mb-4 line-clamp-3">
                  {job.description || "No description provided for this job position."}
                </p>
                
                <div className="mt-auto space-y-4">
                  <p className="text-[14px] font-medium text-[#667085]">
                    Deadline: <span className="text-[#101828]">{new Date(job.deadline).toLocaleDateString('en-GB')}</span>
                  </p>
                  
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium leading-5" 
                    style={{ 
                      backgroundColor: job.is_open ? '#ECFDF3' : '#F9FAFB',
                      color: job.is_open ? '#027A48' : '#344054'
                    }}>
                    {job.is_open ? 'Open' : 'Closed'}
                  </div>
                </div>
              </div>

              {/* Card Footer: Action */}
              <div className="border-t border-[#EAECF0] p-[16px] px-[24px] flex justify-end">
                <Link 
                  href={`/dashboard/admin/jobs/${job.id}`}
                  className="text-[14px] font-semibold text-[#6941C6] hover:text-[#4A3AFF] transition-colors no-underline"
                >
                  See More
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .ant-modal-content {
          border-radius: 12px !important;
          box-shadow: 0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03) !important;
        }
      `}</style>
    </div>
  )
}
