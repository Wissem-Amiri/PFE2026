'use client'

import { useState, useEffect } from 'react'
import { Popconfirm, message, Tooltip, Skeleton } from 'antd'
import { useJobs } from '@/api/hooks'
import Link from 'next/link'
import Image from 'next/image'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('View all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 9
  const [messageApi, contextHolder] = message.useMessage()

  const { data: result, isLoading: loading, refetch } = useJobs({
    page: currentPage,
    pageSize,
    search: '' // Can be hooked up to a search bar later
  })

  const jobs = result?.data || []
  const totalItems = result?.count || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  const handleDelete = async (id: string) => {
    const { deleteJob } = await import('@/api/job')
    const { error } = await deleteJob(id)
    if (error) {
      messageApi.error('Error deleting job')
    } else {
      messageApi.success('Job deleted successfully')
      refetch()
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

  const { isJobOpen } = require('@/api/job')

  // Reset page on tab change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  return (
    <div className="flex-1 p-[32px] px-[40px] h-full overflow-y-auto bg-white font-['Inter',sans-serif]">
      {contextHolder}
      
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-[24px] mb-[32px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-[30px] font-semibold text-[#101828] tracking-tight m-0">Jobs</h1>
          <Link 
            href="/dashboard/admin/jobs/createJob"
            className="flex justify-center items-center gap-2 w-full sm:w-auto px-[16px] py-[10px] bg-[#7F56D9] text-white rounded-[8px] font-medium text-[14px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#6941C6] transition-all no-underline"
          >
            <img src="/assets/plus_white.svg" alt="" className="w-5 h-5" />
            Add Job
          </Link>
        </div>

        {/* ── TABS ── */}
        <div className="relative border-b border-[#EAECF0] w-full">
          <div className="flex gap-8 overflow-x-auto no-scrollbar w-full">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`pb-4 px-1 text-[14px] font-semibold relative transition-colors whitespace-nowrap flex-shrink-0 ${
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
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-[24px]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EAECF0] rounded-[12px] p-[24px] space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton.Button active shape="square" style={{ width: 48, height: 48, borderRadius: 10 }} />
                <div className="flex gap-2">
                  <Skeleton.Avatar active size="small" shape="square" />
                  <Skeleton.Avatar active size="small" shape="square" />
                </div>
              </div>
              <Skeleton active paragraph={{ rows: 2 }} title={{ width: '80%' }} />
              <div className="pt-4 border-t border-[#EAECF0] flex justify-end">
                <Skeleton.Button active size="small" style={{ width: 60 }} />
              </div>
            </div>
          ))}
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
                      backgroundColor: isJobOpen(job) ? '#ECFDF3' : '#FEF2F2',
                      color: isJobOpen(job) ? '#027A48' : '#B91C1C'
                    }}>
                    {isJobOpen(job) ? 'Open' : 'Closed'}
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

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="mt-8 pt-6 border-t border-[#EAECF0] flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] rounded-lg text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <HiOutlineChevronLeft className="w-5 h-5" /> Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg text-[14px] font-semibold transition-all ${
                  currentPage === i + 1
                    ? 'bg-[#F9F5FF] text-[#7F56D9] ring-1 ring-[#7F56D9]'
                    : 'text-[#667085] hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] rounded-lg text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next <HiOutlineChevronRight className="w-5 h-5" />
          </button>
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
