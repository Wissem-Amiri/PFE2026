'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getProfile } from '@/lib/profileService'
import { getAllJobs } from '@/lib/jobService'
import type { Utilisateur } from '@/lib/database.types'
import { Button, Tag } from 'antd'
import { ArrowLeftOutlined, EllipsisOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons'

export default function RegistrationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const jobId = searchParams.get('jobId')

  const [user, setUser] = useState<Utilisateur | null>(null)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
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
        if (targetJob) setJobTitle(targetJob.title)
      }
      setLoading(false)
    }

    loadData()
  }, [id, jobId])

  if (loading) {
    return <div className="p-8 text-[#98A2B3]">Loading candidate profile...</div>
  }

  if (!user) {
    return (
      <div className="p-8">
        <h2 className="text-[#101828]">Candidate not found</h2>
        <Button onClick={() => router.push('/dashboard/admin/registrations')}>Go Back</Button>
      </div>
    )
  }

  // Fallbacks for mock data in UI
  const avatarInitials = user.user_name ? user.user_name.substring(0, 2).toUpperCase() : 'UN'

  const formatExDate = (dateStr: string) => {
    if (!dateStr) return 'Present'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex-1 p-[32px] max-w-6xl mx-auto w-full h-full overflow-y-auto">
      {/* Top action bar */}
      <div className="mb-[32px]">
        <button
          onClick={() => router.push('/dashboard/admin/registrations')}
          className="flex items-center gap-[8px] px-[16px] py-[8px] border border-[#D0D5DD] rounded-[8px] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftOutlined /> Go Back
        </button>
      </div>

      {/* Header Profile Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-[40px] gap-4">
        <div className="flex items-center gap-[20px]">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-[#F0FDF4] border border-[#EAECF0] flex items-center justify-center shrink-0 text-[#16A34A] text-2xl font-bold">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              avatarInitials
            )}
          </div>
          <div>
            <h1 className="text-[30px] font-bold text-[#101828] m-0 mb-[4px]">{user.user_name || 'Anonymous User'}</h1>
            <div className="flex items-center gap-[10px]">
              <p className="text-[16px] text-[#475467] m-0">{user.email}</p>
              {jobTitle && (
                <>
                  <span className="w-[4px] h-[4px] rounded-full bg-[#D0D5DD]"></span>
                  <Tag color="purple" className="font-medium rounded-full px-[12px] py-[2px] border-none bg-[#F5F3FF] text-[#7C3AED]">
                    Applying for: {jobTitle}
                  </Tag>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[12px]">
          <button className="w-[40px] h-[40px] rounded-[8px] border border-[#D0D5DD] bg-white flex items-center justify-center text-[#344054] cursor-pointer hover:bg-gray-50 transition-colors">
            <EllipsisOutlined className="text-xl" />
          </button>
          <button className="h-[40px] px-[16px] rounded-[8px] bg-[#7C3AED] text-white font-medium text-[14px] flex items-center gap-[8px] cursor-pointer hover:bg-[#6D28D9] transition-colors border-none">
            <PlusOutlined /> View portfolio
          </button>
        </div>
      </div>

      <div className="border-t border-[#F2F4F7] mb-[40px]"></div>

      {/* Experience Subtitle */}
      <div className="mb-[40px]">
        <h2 className="text-[18px] font-BOLD text-[#101828] mb-[8px] m-0">Experience</h2>
        <p className="text-[14px] text-[#475467] m-0">
          {user.position ? `I specialise in ${user.position}.` : 'I specialize in UX/UI design, brand strategy, and Webflow development.'}
        </p>
      </div>

      <div className="border-t border-[#F2F4F7] mb-[40px]"></div>

      {/* Main Content Grid */}
      <div className="flex flex-col md:flex-row gap-[32px] md:gap-[64px] mb-[48px] justify-between">
        {/* Left Column - About */}
        <div className="flex-1 min-w-0 max-w-[500px]">
          <h2 className="text-[18px] font-bold text-[#101828] mb-[16px] m-0">About me</h2>
          <div className="text-[14px] text-[#475467] leading-[24px] space-y-[16px]">
            {user.bio ? (
              <>
                <p className="m-0 whitespace-pre-wrap break-all">
                  {isBioExpanded || user.bio.length <= 100
                    ? user.bio
                    : `${user.bio.substring(0, 100)}...`}
                </p>
                {user.bio.length > 100 && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-[#7C3AED] font-medium text-[14px] bg-transparent border-none p-0 cursor-pointer hover:underline mt-[8px]"
                  >
                    {isBioExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="m-0">I'm a Product Designer based in Melbourne, Australia. I specialise in UX/UI design, brand strategy, and Webflow development. I'm always striving to grow and learn something new and I don't take myself too seriously.</p>
                <p className="m-0">I'm passionate about helping startups grow, improve their customer experience, and to raise venture capital through good design.</p>
                <button className="text-[#7C3AED] font-medium text-[14px] bg-transparent border-none p-0 cursor-pointer hover:underline mt-[8px]">
                  Read more
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="w-[300px] shrink-0 grid grid-cols-2 gap-y-[24px] gap-x-[16px]">
          <div>
            <h4 className="text-[12px] font-medium text-[#475467] mb-[8px] m-0">Location</h4>
            <div className="flex items-center gap-[8px] text-[14px] font-medium text-[#101828]">
              {user.country ? `🌍 ${user.country}` : '🇦🇺 Melbourne, Australia'}
            </div>
          </div>
          <div>
            <h4 className="text-[12px] font-medium text-[#475467] mb-[8px] m-0">Website</h4>
            {user.website ? (
              <a href={user.website} target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#7C3AED] hover:underline flex items-center gap-[4px] no-underline break-all">
                {user.website} ↗
              </a>
            ) : <span className="text-[14px] text-[#98A2B3]">—</span>}
          </div>
          <div>
            <h4 className="text-[12px] font-medium text-[#475467] mb-[8px] m-0">Portfolio</h4>
            {user.portfolio ? (
              <a href={user.portfolio} target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#7C3AED] hover:underline flex items-center gap-[4px] no-underline break-all">
                {user.portfolio} ↗
              </a>
            ) : <span className="text-[14px] text-[#98A2B3]">—</span>}
          </div>
          <div>
            <h4 className="text-[12px] font-medium text-[#475467] mb-[8px] m-0">Email</h4>
            <a href={`mailto:${user.email}`} className="text-[14px] font-medium text-[#7C3AED] hover:underline flex items-center gap-[4px] no-underline break-words">
              {user.email} ↗
            </a>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="flex flex-col md:flex-row gap-[24px] mb-[48px]">
        {/* Motivational Letter Card */}
        <div className="flex-1">
          <h2 className="text-[16px] font-bold text-[#101828] mb-[16px] m-0">Motivational letter</h2>
          {user.motivational_letter_url ? (
            <div className="h-[72px] rounded-[12px] border border-[#EAECF0] bg-white flex items-center px-[20px] shadow-sm hover:border-[#7C3AED] transition-colors">
              <div className="flex gap-[12px] items-center">
                <div className="w-[40px] h-[40px] rounded-full bg-[#F9F5FF] flex items-center justify-center text-[#7C3AED]">
                  <FileTextOutlined />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#101828]">Cover_Letter.pdf</div>
                  <a href={user.motivational_letter_url} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[#7C3AED] hover:underline cursor-pointer no-underline block mt-[2px]">View file</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[72px] rounded-[12px] border border-dashed border-[#EAECF0] bg-gray-50 flex items-center justify-center text-[13px] text-[#98A2B3]">
              No letter provided
            </div>
          )}
        </div>

        {/* Resume Card */}
        <div className="flex-1">
          <h2 className="text-[16px] font-bold text-[#101828] mb-[16px] m-0">Resume</h2>
          {user.resume_url ? (
            <div className="h-[72px] rounded-[12px] border border-[#EAECF0] bg-white flex items-center px-[20px] shadow-sm hover:border-[#7C3AED] transition-colors">
              <div className="flex gap-[12px] items-center">
                <div className="w-[40px] h-[40px] rounded-full bg-[#F9F5FF] flex items-center justify-center text-[#7C3AED]">
                  <FileTextOutlined />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#101828]">Resume_Current.pdf</div>
                  <a href={user.resume_url} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[#7C3AED] hover:underline cursor-pointer no-underline block mt-[2px]">View file</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[72px] rounded-[12px] border border-dashed border-[#EAECF0] bg-gray-50 flex items-center justify-center text-[13px] text-[#98A2B3]">
              No resume provided
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Experience Cards */}
      {(!user.experiences || user.experiences.length === 0) ? (
        <div className="rounded-[12px] border border-dashed border-[#EAECF0] bg-gray-50 flex flex-col items-center justify-center py-[48px] text-[14px] text-[#98A2B3]">
          No experiences recorded by the applicant.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          {user.experiences.map((exp: any, i: number) => (
            <div key={i} className="rounded-[12px] border border-[#EAECF0] bg-white p-[24px] shadow-sm flex flex-col justify-between h-[180px]">
              <div>
                <h3 className="text-[16px] font-bold text-[#101828] m-0 text-center">{exp.title}</h3>
                <p className="text-[14px] text-[#475467] m-0 text-center mt-[4px]">{exp.company}</p>
              </div>
              <div className="flex flex-col items-center mt-auto">
                <span className="text-[13px] text-[#475467] mb-[16px]">{formatExDate(exp.startDate)} – {formatExDate(exp.endDate)}</span>
                {exp.projectUrl ? (
                  <a href={exp.projectUrl} target="_blank" rel="noreferrer" className="text-[#7C3AED] font-medium text-[14px] no-underline self-end hover:underline">
                    View project
                  </a>
                ) : (
                  <div className="h-[21px] self-end"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
