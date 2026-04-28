'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getProfile } from '@/api/profile'
import { getAllJobs } from '@/api/job'
import type { FullProfile } from '@/api/database.types'
import { Button, Tag, Tabs, Skeleton, message, Tooltip } from 'antd'
import { ArrowLeftOutlined, EllipsisOutlined, FileTextOutlined, LinkOutlined, GlobalOutlined, MailOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

export default function RegistrationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const jobId = searchParams.get('jobId')

  const [user, setUser] = useState<FullProfile | null>(null)
  const [job, setJob] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBioExpanded, setIsBioExpanded] = useState(false)

  useEffect(() => {
    if (!id) return
    
    const loadData = async () => {
      setLoading(true)
      const { data: profile } = await getProfile(id)
      setUser(profile)

      if (jobId) {
        const { data: jobs } = await getAllJobs()
        const targetJob = jobs?.find(j => j.id === jobId)
        if (targetJob) setJob(targetJob)
      }
      setLoading(false)
    }

    loadData()
  }, [id, jobId])

  const formatExDate = (dateStr: string) => {
    if (!dateStr) return 'Present'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex-1 p-[32px] h-full bg-white font-['Inter',sans-serif]">
        <div className="flex justify-between items-center mb-[48px]">
          <Skeleton.Button active size="large" style={{ width: 120 }} />
          <div className="flex gap-3">
             <Skeleton.Button active size="large" style={{ width: 40 }} />
             <Skeleton.Button active size="large" style={{ width: 140 }} />
          </div>
        </div>
        <div className="flex gap-6 mb-8">
           <Skeleton.Avatar active size={80} shape="circle" />
           <div className="flex-1 pt-2">
             <Skeleton active paragraph={{ rows: 2 }} title={false} />
           </div>
        </div>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-[32px] font-['Inter',sans-serif]">
        <h2 className="text-[#101828]">Candidate not found</h2>
        <Button onClick={() => router.push('/dashboard/admin/registrations')}>Go Back</Button>
      </div>
    )
  }

  const ProfileTab = () => (
    <div className="flex flex-col gap-[48px] pt-[24px]">
      {/* Experience Subtitle */}
      <div className="flex flex-col gap-[8px]">
        <h2 className="text-[18px] font-semibold text-[#101828] m-0">Experience</h2>
        <p className="text-[14px] text-[#475467] m-0">
          {user.candidat?.position ? `I specialise in ${user.candidat.position}.` : 'I specialize in UX/UI design, brand strategy, and Webflow development.'}
        </p>
      </div>

      <div className="h-[1px] bg-[#EAECF0]"></div>

      {/* About me & Details */}
      <div className="flex flex-col md:flex-row gap-[64px]">
        {/* Left: About me */}
        <div className="flex-1 flex flex-col gap-[16px]">
          <h2 className="text-[18px] font-semibold text-[#101828] m-0">About me</h2>
          <div className="text-[14px] text-[#475467] leading-[24px]">
            {user.candidat?.bio ? (
              <div className="flex flex-col gap-[12px]">
                <p className="m-0 whitespace-pre-wrap">
                  {isBioExpanded || user.candidat.bio.length <= 250
                    ? user.candidat.bio
                    : `${user.candidat.bio.substring(0, 250)}...`}
                </p>
                {user.candidat.bio.length > 250 && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-[#7F56D9] font-medium text-[14px] bg-transparent border-none p-0 cursor-pointer hover:underline self-start"
                  >
                    {isBioExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            ) : (
              <p className="m-0 italic">No bio provided by the candidate.</p>
            )}
          </div>
        </div>

        {/* Right: Specific details */}
        <div className="w-[320px] flex flex-wrap gap-y-[24px]">
           <div className="w-1/2 flex flex-col gap-[8px]">
              <span className="text-[12px] font-medium text-[#667085]">Location</span>
              <div className="flex items-center gap-[8px] text-[14px] font-medium text-[#101828]">
                <GlobalOutlined className="text-[#667085]" />
                {user.candidat?.country || 'Remote'}
              </div>
           </div>
           <div className="w-1/2 flex flex-col gap-[8px]">
              <span className="text-[12px] font-medium text-[#667085]">Email</span>
              <div className="flex items-center gap-[8px] text-[14px] font-medium text-[#101828] break-all">
                <MailOutlined className="text-[#667085]" />
                {user.email}
              </div>
           </div>
           {user.candidat?.website && (
             <div className="w-1/2 flex flex-col gap-[8px]">
                <span className="text-[12px] font-medium text-[#667085]">Website</span>
                <a href={user.candidat.website} target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#7F56D9] hover:underline flex items-center gap-[6px]">
                  <LinkOutlined /> {new URL(user.candidat.website).hostname}
                </a>
             </div>
           )}
           {user.candidat?.portfolio && (
             <div className="w-1/2 flex flex-col gap-[8px]">
                <span className="text-[12px] font-medium text-[#667085]">Portfolio</span>
                <a href={user.candidat.portfolio} target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#7F56D9] hover:underline flex items-center gap-[6px]">
                  <FileTextOutlined /> Portfolio ↗
                </a>
             </div>
           )}
        </div>
      </div>

      <div className="h-[1px] bg-[#EAECF0]"></div>

      {/* Documents Section */}
      <div className="flex flex-col gap-[16px]">
        <h2 className="text-[16px] font-semibold text-[#101828] m-0">Documents</h2>
        <div className="flex flex-col md:flex-row gap-[24px]">
           {/* Motivational Letter */}
           <div className="flex-1 flex flex-col gap-[12px]">
              <span className="text-[14px] font-medium text-[#344054]">Motivational letter</span>
              {user.candidat?.motivational_letter_url ? (
                <div className="p-[16px] rounded-[12px] border border-[#EAECF0] bg-white flex items-center justify-between hover:border-[#7F56D9] transition-colors shadow-sm">
                  <div className="flex gap-[12px] items-center">
                    <div className="w-[40px] h-[40px] rounded-full bg-[#F9F5FF] flex items-center justify-center text-[#7F56D9]">
                      <FileTextOutlined className="text-[20px]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[#101828]">Cover_Letter.pdf</div>
                      <div className="text-[12px] text-[#667085]">PDF • 1.2 MB</div>
                    </div>
                  </div>
                  <a href={user.candidat.motivational_letter_url} target="_blank" rel="noreferrer" className="text-[#7F56D9] font-medium text-[14px] hover:underline">View file</a>
                </div>
              ) : (
                <div className="p-[16px] rounded-[12px] border border-dashed border-[#EAECF0] bg-[#F9FAFB] text-center text-[#667085] text-[14px]">No letter uploaded</div>
              )}
           </div>

           {/* Resume */}
           <div className="flex-1 flex flex-col gap-[12px]">
              <span className="text-[14px] font-medium text-[#344054]">Resume</span>
              {user.candidat?.resume_url ? (
                <div className="p-[16px] rounded-[12px] border border-[#EAECF0] bg-white flex items-center justify-between hover:border-[#7F56D9] transition-colors shadow-sm">
                  <div className="flex gap-[12px] items-center">
                    <div className="w-[40px] h-[40px] rounded-full bg-[#F9F5FF] flex items-center justify-center text-[#7F56D9]">
                      <FileTextOutlined className="text-[20px]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[#101828]">Resume_v2.pdf</div>
                      <div className="text-[12px] text-[#667085]">PDF • 2.4 MB</div>
                    </div>
                  </div>
                  <a href={user.candidat.resume_url} target="_blank" rel="noreferrer" className="text-[#7F56D9] font-medium text-[14px] hover:underline">View file</a>
                </div>
              ) : (
                <div className="p-[16px] rounded-[12px] border border-dashed border-[#EAECF0] bg-[#F9FAFB] text-center text-[#667085] text-[14px]">No resume uploaded</div>
              )}
           </div>
        </div>
      </div>

      {/* Experience Cards */}
      <div className="flex flex-col gap-[16px]">
        <h2 className="text-[18px] font-semibold text-[#101828] m-0">Experience Timeline</h2>
        {(!user.candidat?.experiences || user.candidat.experiences.length === 0) ? (
          <div className="p-[48px] rounded-[12px] border border-dashed border-[#EAECF0] bg-[#F9FAFB] text-center text-[#667085]">
            No experience history provided.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[16px]">
            {user.candidat.experiences.map((exp: any, i: number) => (
              <div key={i} className="w-full md:w-[calc(33.33%-11px)] p-[24px] rounded-[12px] border border-[#EAECF0] bg-white shadow-sm flex flex-col justify-between h-[200px] hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#101828] m-0">{exp.title}</h3>
                  <p className="text-[14px] text-[#667085] m-0 mt-[4px]">{exp.company}</p>
                </div>
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[13px] text-[#667085]">{formatExDate(exp.startDate)} – {formatExDate(exp.endDate)}</span>
                  {exp.projectUrl && (
                    <a href={exp.projectUrl} target="_blank" rel="noreferrer" className="text-[#7F56D9] font-medium text-[14px] hover:underline">
                      View project ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const JobDetailTab = () => (
    <div className="flex flex-col gap-[48px] pt-[24px]">
      <div className="flex flex-col gap-[16px]">
         <h2 className="text-[18px] font-semibold text-[#101828] m-0">Job overview</h2>
         <div className="p-[20px] rounded-[12px] bg-[#F9F5FF] text-[#6941C6] text-[14px] leading-[24px]">
           {job?.description?.substring(0, 300)}...
         </div>
      </div>

      <div className="flex flex-col gap-[16px]">
         <h2 className="text-[18px] font-semibold text-[#101828] m-0">About the Job</h2>
         <div className="text-[14px] text-[#475467] leading-[26px] max-w-[800px] whitespace-pre-wrap">
           {job?.description || 'No detailed description available for this position.'}
         </div>
      </div>

      <div className="flex flex-col gap-[12px]">
         <h3 className="text-[16px] font-semibold text-[#101828] m-0">Requirements</h3>
         <ul className="text-[14px] text-[#475467] leading-[28px] m-0 pl-[20px]">
           {job?.requirements ? (
             job.requirements.split('\n').filter(r => r.trim()).map((req: string, idx: number) => (
               <li key={idx}>{req}</li>
             ))
           ) : (
             <li>No specific requirements listed.</li>
           )}
         </ul>
      </div>
    </div>
  )

  return (
    <div className="flex-1 p-[32px] h-full overflow-y-auto bg-white font-['Inter',sans-serif]">
      {/* Top action bar */}
      <div className="flex justify-between items-center mb-[48px]">
        <button
          onClick={() => router.push('/dashboard/admin/registrations')}
          className="flex items-center gap-[8px] px-[16px] py-[10px] border border-[#D0D5DD] rounded-[8px] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeftOutlined /> Go Back
        </button>
        <div className="flex gap-[12px]">
           <button 
             onClick={() => user.candidat?.resume_url && window.open(user.candidat.resume_url)}
             className="h-[44px] px-[18px] rounded-[8px] bg-[#7F56D9] text-white font-medium text-[14px] flex items-center gap-[8px] cursor-pointer hover:bg-[#6941C6] transition-colors border-none shadow-sm"
           >
             View portfolio
           </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex gap-[28px] items-center mb-[40px]">
        <div 
          className="w-[80px] h-[80px] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-[#EAECF0]"
          style={{ backgroundImage: user.avatar_url ? 'none' : 'linear-gradient(45deg, #29359B 0%, #6068CA 100%)' }}
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-2xl font-bold">{user.user_name?.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col gap-[4px]">
          <h1 className="text-[32px] font-semibold text-[#101828] m-0">{user.user_name || 'Anonymous User'}</h1>
          <div className="flex items-center gap-[12px]">
            <span className="text-[16px] text-[#667085]">{user.email}</span>
            {job && (
              <>
                <div className="w-[4px] h-[4px] rounded-full bg-[#D0D5DD]"></div>
                <Tag className="bg-[#F9F5FF] text-[#7F56D9] border-none rounded-full px-[12px] py-[2px] font-medium m-0">
                  Applied for: {job.title}
                </Tag>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs 
        defaultActiveKey="1" 
        size="large"
        className="custom-tabs"
        items={[
          {
            key: '1',
            label: 'Profile',
            children: <ProfileTab />,
          },
          {
            key: '2',
            label: 'Job Details',
            children: <JobDetailTab />,
          },
        ]}
      />

      <style jsx global>{`
        .custom-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #EAECF0 !important;
        }
        .custom-tabs .ant-tabs-tab {
          font-family: 'Inter', sans-serif !important;
          color: #667085 !important;
          padding: 12px 4px !important;
        }
        .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #7F56D9 !important;
          font-weight: 600 !important;
        }
        .custom-tabs .ant-tabs-ink-bar {
          background: #7F56D9 !important;
        }
      `}</style>
    </div>
  )
}
