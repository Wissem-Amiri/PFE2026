'use client'

import { useState, useEffect } from 'react'
import { Popconfirm, message } from 'antd'
import { getAllJobs, deleteJob } from '@/lib/jobService'
import type { Job } from '@/lib/database.types'
import Link from 'next/link'

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

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto">
      {contextHolder}
      
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="text-[22px] font-bold text-[#101828] mb-0">Jobs</h1>
        <div className="flex gap-[8px] items-center">
          <Link 
            href="/dashboard/admin/jobs/createJob"
            className="px-[14px] py-[7px] border border-[#7C3AED] rounded-[8px] bg-[#7C3AED] text-white font-['Sora',sans-serif] text-[12px] font-medium cursor-pointer hover:bg-[#6D28D9] no-underline inline-block"
          >
            + Add Job
          </Link>
        </div>
      </div>

      <div className="flex gap-[20px] border-b border-[#E4E7EC] mb-[24px] overflow-x-auto">
        {tabs.map(tab => (
          <div 
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`pb-[12px] text-[13px] font-medium cursor-pointer relative whitespace-nowrap ${activeTab === tab.label ? 'text-[#7C3AED]' : 'text-[#475467] hover:text-[#101828]'}`}
          >
            {tab.label} ({tab.count})
            {activeTab === tab.label && (
              <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#7C3AED] rounded-t-[2px]"></div>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-10 text-slate-400">No jobs found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[20px]">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white border border-[#E4E7EC] rounded-[16px] p-[20px] transition-all hover:-translate-y-[2px] hover:shadow-sm">
              <div className="flex justify-between items-start mb-[12px]">
                <div className="flex gap-[12px] items-center">
                  {job.job_picture ? (
                    <img src={job.job_picture} alt="Job logo" className="w-[40px] h-[40px] rounded-[8px] object-cover bg-gray-50 border border-gray-100" />
                  ) : (
                    <div className="w-[40px] h-[40px] rounded-[8px] bg-[#4F46E5] flex-shrink-0"></div>
                  )}
                  <h3 className="text-[16px] font-semibold text-[#101828] leading-[1.3] m-0 cursor-pointer hover:text-[#7C3AED]">
                    {job.title}
                  </h3>
                </div>
                <div className="flex gap-[12px] text-[14px] opacity-70">
                  <span className="cursor-pointer hover:opacity-100 hover:text-[#7C3AED]" title="Copy link">🔗</span>
                  <Link href={`/dashboard/admin/jobs/editJob/${job.id}`} className="cursor-pointer hover:opacity-100 hover:text-[#7C3AED] no-underline" title="Edit">✏️</Link>
                  <Popconfirm
                    title="Delete Job"
                    description="Are you sure to delete this job?"
                    onConfirm={() => handleDelete(job.id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <span className="cursor-pointer hover:opacity-100 hover:text-red-500" title="Delete">🗑️</span>
                  </Popconfirm>
                </div>
              </div>
              <p className="text-[12px] text-[#475467] leading-[1.6] mb-[20px] min-h-[58px] line-clamp-3">
                {job.description}
              </p>
              <div className="flex justify-between items-center bg-[#F9FAFB] p-[12px] rounded-[8px]">
                <div className="flex gap-[6px]">
                  {job.is_open ? (
                    <div className="inline-block px-[10px] py-[4px] rounded-full text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                      Open
                    </div>
                  ) : (
                    <div className="inline-block px-[10px] py-[4px] rounded-full text-[10px] font-semibold bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                      Closed
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#98A2B3] block mb-[2px]">Deadline:</span>
                  <span className="text-[12px] text-[#101828] font-bold">
                    {new Date(job.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Link 
                href={`/dashboard/admin/jobs/${job.id}`}
                className="block text-center w-full mt-[16px] px-[12px] py-[8px] rounded-[8px] border-[1.5px] border-[#D0D5DD] bg-white font-['Sora',sans-serif] text-[12px] font-medium text-[#101828] cursor-pointer hover:border-[#7c3aed] hover:text-[#7C3AED] transition-colors no-underline"
              >
                See More
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
