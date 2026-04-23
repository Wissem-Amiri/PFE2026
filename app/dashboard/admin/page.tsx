'use client'
import { useEffect, useState } from 'react'
import { getAllUsers, getProfile } from '@/api/profile'
import { getAllLeavesDetailed } from '@/api/conge'
import { getAllCandidaturesDetailed } from '@/api/candidatures'
import { useAuth } from '@/api/AuthContext'
import Link from 'next/link'
import type { FullProfile } from '@/api/database.types'
import {
  Avatar,
  Table,
  Tag,
  Tooltip,
  message,
  Pagination
} from 'antd'
import {
  UserOutlined,
  SearchOutlined,
  EllipsisOutlined,
  CalendarOutlined,
  SolutionOutlined,
  ArrowRightOutlined,
  InboxOutlined,
  SunFilled,
  AlertFilled,
  LockFilled,
  MedicineBoxFilled,
  FileSearchOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import {
  HiOutlineSun,
  HiOutlineBriefcase,
  HiOutlineArrowDown,
  HiOutlineBell,
  HiOutlineLockClosed,
  HiOutlineHeart
} from 'react-icons/hi'
import dayjs from 'dayjs'

import { useLeaves, useCandidatures } from '@/api/hooks'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [adminProfile, setAdminProfile] = useState<FullProfile | null>(null)
  
  const { data: leaves = [], isLoading: leavesLoading } = useLeaves()
  const { data: candidatures = [], isLoading: candidaturesLoading } = useCandidatures()
  
  const loading = leavesLoading || candidaturesLoading
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        const { data } = await getProfile(user.id)
        setAdminProfile(data)
      }
    }
    fetchData()
  }, [user?.id])

  // Aggregated Activity Feed
  const activities = [
    ...leaves.map(l => ({
      id: l.id,
      date: l.created_at,
      type: 'leave',
      user: l.employee?.user,
      details: `Requested ${l.type} Leave`,
      status: l.status,
      leaveType: l.type
    })),
    ...candidatures.map(c => ({
      id: c.id,
      date: c.applied_at,
      type: 'candidature',
      user: c.postulant?.user,
      details: `Applied for ${c.job?.title}`,
      status: c.status
    }))
  ].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())

  const filteredActivities = activities.filter(a =>
    (a.user?.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.details || '').toLowerCase().includes(search.toLowerCase())
  )


  const stats = [
    {
      title: 'Registration requests',
      count: candidatures.filter(c => c.status === 'pending').length.toString(),
      href: '/dashboard/admin/registrations'
    },
    {
      title: 'Leave requests',
      count: leaves.filter(l => l.status === 'pending').length.toString(),
      href: '/dashboard/admin/leaves'
    },
    {
      title: 'Job submissions',
      count: candidatures.length.toString(),
      href: '/dashboard/admin/jobs'
    },
  ]



  const CustomEmpty = () => (
    <div className="flex flex-col items-center justify-center py-[60px]">
      <div className="w-[64px] h-[64px] bg-[#f9fafb] border border-[#eaecf0] rounded-[18px] flex items-center justify-center mb-4 shadow-sm">
        <InboxOutlined className="text-[#d0d5dd] text-[28px]" />
      </div>
      <span className="text-[14px] text-[#667085] font-medium">No recent activity</span>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FCFCFD]">
      {/* Sidebar Placeholder (Space reserved to match Figma's x=243) */}
      
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 bg-[#FCFCFD] rounded-tl-[40px] pt-[32px] pb-[48px] overflow-y-auto">
        {/* Header section (3024:10913) */}
        <div className="px-[24px] flex justify-between items-center mb-[32px]">
          <h1 className="text-[30px] font-medium text-[#101828] leading-[38px] font-['Inter']">Home</h1>
          <div className="flex items-center gap-[12px]">
            <div className="relative flex items-center group">
              <div className={`flex items-center bg-white border border-[#eaecf0] rounded-[8px] px-[12px] py-[8px] transition-all duration-300 shadow-sm
                ${search ? 'w-[280px] border-[#7f56d9] ring-2 ring-[#7f56d9]/10' : 'w-[40px] hover:w-[280px] hover:border-[#7f56d9]'}`}>
                <img src="/assets/search.svg" className="w-[18px] h-[18px] opacity-70 shrink-0" alt="Search" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ml-3 w-full bg-transparent border-none outline-none text-[14px] text-[#101828] placeholder:text-[#667085] font-['Inter']"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS (Strict Figma Structure 3024:10912) ── */}
        <div className="px-[24px] grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[32px]">
          {stats.map((stat, idx) => (
            <Link key={idx} href={stat.href} className="no-underline block group">
              <div className="bg-white p-[14.87px] h-[96.8px] rounded-[16px] border border-[#eaecf0] shadow-[0px_8px_16px_-4px_rgba(16,24,40,0.04)] hover:shadow-[0px_12px_24px_-4px_rgba(16,24,40,0.1)] group-hover:border-[#7f56d9] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-semibold text-[#101828] leading-[14.8px] font-['Inter'] uppercase tracking-wider">{stat.title}</span>
                </div>
                <div className="flex items-end mb-[9.2px]">
                  <span className="text-[22.3px] font-semibold text-[#101828] leading-[27.3px] font-['Inter'] tracking-[-0.44px]">{stat.count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── TABLE (Strict Figma Activity 3024:10940) ── */}
        <div className="ml-[24px] mr-[24px] bg-white rounded-[16px] border border-[#eaecf0] shadow-[0px_8px_16px_-4px_rgba(16,24,40,0.04)] overflow-hidden mb-[48px]">
          <div className="px-6 py-5 border-b border-[#eaecf0] flex justify-between items-center">
            <h3 className="text-[18px] font-medium text-[#101828] font-['Inter'] mb-0 leading-[28px]">Recent activity</h3>
          </div>

          <div className="overflow-x-auto">
            <Table
              columns={[
                {
                  title: '',
                  key: 'selection',
                  width: 64,
                  render: () => <div className="pl-6"><input type="checkbox" className="w-5 h-5 rounded-full border-[#d0d5dd] accent-[#7f56d9] cursor-pointer" /></div>,
                },
                {
                  title: (
                    <div className="flex items-center gap-[4px] group cursor-pointer">
                      <span className="text-[12px] font-medium text-[#667085] font-['Inter'] uppercase">Submission Date</span>
                      <HiOutlineArrowDown className="w-[14px] h-[14px] text-[#667085] opacity-60" />
                    </div>
                  ),
                  key: 'applicant',
                  render: (record: any) => (
                    <div className="flex items-center gap-[12px]">
                      <Avatar
                        size={40}
                        src={record.user?.avatar_url}
                        className="bg-[#c7b9da] rounded-full shrink-0"
                      >
                        {record.user?.user_name?.substring(0, 2).toUpperCase() || 'U'}
                      </Avatar>
                      <span className="text-[14px] font-medium text-[#101828] font-['Inter']">{record.user?.user_name || 'Unknown'}</span>
                    </div>
                  )
                },
                {
                  title: <span className="text-[12px] font-medium text-[#667085] font-['Inter'] uppercase">Date</span>,
                  key: 'date_range',
                  render: (record: any) => (
                    <span className="text-[14px] text-[#667085] font-['Inter']">
                      {record.type === 'leave' 
                        ? `${dayjs(record.date).format('MM/DD/YYYY')} to ${dayjs(record.date).add(2, 'day').format('MM/DD/YYYY')}` 
                        : `${dayjs(record.date).format('MM/DD/YYYY')} ${dayjs(record.date).format('HH:mm')}`}
                    </span>
                  )
                },
                {
                  title: <span className="text-[12px] font-medium text-[#667085] font-['Inter'] uppercase">Activity</span>,
                  key: 'activity',
                  render: (record: any) => {
                    const isLeave = record.type === 'leave';
                    
                    let config = {
                      icon: <HiOutlineBriefcase className="w-[14px] h-[14px]" />,
                      color: '#3CB50D',
                      bg: '#3CB50D11',
                      border: '#3CB50D33'
                    };

                    if (isLeave) {
                      const type = record.leaveType;
                      if (type === 'Vacation') {
                        config = { icon: <HiOutlineSun className="w-[14px] h-[14px]" />, color: '#F97316', bg: '#F9731611', border: '#F9731633' };
                      } else if (type === 'Casual') {
                        config = { icon: <HiOutlineBell className="w-[14px] h-[14px]" />, color: '#7C3AED', bg: '#7C3AED11', border: '#7C3AED33' };
                      } else if (type === 'Personal') {
                        config = { icon: <HiOutlineLockClosed className="w-[14px] h-[14px]" />, color: '#3B82F6', bg: '#3B82F611', border: '#3B82F633' };
                      } else if (type === 'Sick') {
                        config = { icon: <HiOutlineHeart className="w-[14px] h-[14px]" />, color: '#EF4444', bg: '#EF444411', border: '#EF444433' };
                      } else {
                        // Default leave color (Orange)
                        config = { icon: <HiOutlineSun className="w-[14px] h-[14px]" />, color: '#F97316', bg: '#F9731611', border: '#F9731633' };
                      }
                    }

                    return (
                      <div className="flex items-center">
                        <div 
                          className="px-[12px] py-[4px] rounded-full flex items-center gap-[6px] border"
                          style={{ backgroundColor: config.bg, borderColor: config.border }}
                        >
                            <span style={{ color: config.color, display: 'flex', alignItems: 'center' }}>
                              {config.icon}
                            </span>
                            <span 
                              className="text-[12px] font-medium whitespace-nowrap leading-[18px] font-['Inter']"
                              style={{ color: config.color }}
                            >
                              {record.details}
                            </span>
                        </div>
                      </div>
                    )
                  }
                }
              ]}
              dataSource={filteredActivities}
              pagination={{ 
                  pageSize: 10, 
                  hideOnSinglePage: true, 
                  position: ['bottomCenter'],
                  className: 'custom-pagination',
                  itemRender: (page, type, originalElement) => {
                    if (type === 'prev') return <button className="px-[14px] py-[8px] bg-white border border-[#d0d5dd] rounded-[8px] shadow-sm text-[14px] font-medium text-[#344054] hover:bg-gray-50 flex items-center gap-[8px] mr-4 font-['Inter']"><img src="/assets/arrow-left.svg" className="w-[14px] h-[14px]" alt="" /> Previous</button>
                    if (type === 'next') return <button className="px-[14px] py-[8px] bg-white border border-[#d0d5dd] rounded-[8px] shadow-sm text-[14px] font-medium text-[#344054] hover:bg-gray-50 flex items-center gap-[8px] ml-4 font-['Inter']">Next <img src="/assets/arrow-right.svg" className="w-[14px] h-[14px]" alt="" /></button>
                    return originalElement
                  }
              }}
              loading={loading}
              className="figma-dashboard-table decoration-table"
              rowKey={(record) => `${record.type}-${record.id}`}
              locale={{ emptyText: <CustomEmpty /> }}
            />
          </div>
        </div>
      </div>


      <div className="w-full lg:w-[296px] bg-transparent pr-[32px] pt-[40px] flex flex-col items-center">
        <div className="sticky top-[40px] w-full flex flex-col items-center gap-[24px]">
          
          <div className="w-full flex flex-col items-center">
            {/* Admin Avatar Section (Figma 3024:10941) */}
            <div className="relative mb-[24px] border-4 border-white shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)] rounded-full h-[160px] w-[160px] flex items-center justify-center overflow-hidden">
                <Avatar
                  size={160}
                  src={adminProfile?.avatar_url}
                  className="bg-[#c7b9da] rounded-full"
                >
                    {adminProfile?.user_name?.substring(0, 2).toUpperCase() || 'AD'}
                </Avatar>
            </div>

            <div className="flex flex-col gap-[4px] items-center mb-[24px]">
              <h2 className="text-[24px] font-medium text-[#101828] font-['Inter'] leading-[32px] m-0">{adminProfile?.user_name || 'Farouk Abichou'}</h2>
              <p className="text-[16px] text-[#667085] font-normal font-['Inter'] leading-[24px] m-0 capitalize">{adminProfile?.role || 'Admin'}</p>
            </div>

            <div className="flex items-center gap-[12px] w-full justify-center">
              <Link href="/dashboard/admin/settings?tab=account">
                <button className="h-[40px] px-[16px] rounded-[8px] border border-[#d0d5dd] bg-white text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-all shadow-sm font-['Inter']">Settings</button>
              </Link>
              <Link href="/dashboard/admin/settings?tab=profile">
                <button className="h-[40px] px-[16px] rounded-[8px] bg-[#7f56d9] text-[14px] font-medium text-white hover:bg-[#6941c6] transition-all shadow-sm font-['Inter']">View profile</button>
              </Link>
            </div>
          </div>
        </div>
      </div>



      <style jsx global>{`
        .figma-dashboard-table.decoration-table .ant-table-thead > tr > th {
          background: #f9fafb !important;
          color: #667085 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 12px 24px !important;
          border-bottom: 1px solid #eaecf0 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-family: 'Inter', sans-serif !important;
        }
        .figma-dashboard-table.decoration-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid #eaecf0 !important;
          height: 72px !important;
        }
        .figma-dashboard-table.decoration-table .ant-table-row:hover > td {
          background-color: #fcfcfd !important;
        }
        .custom-pagination {
          margin: 0 !important;
          padding: 16px 24px !important;
          border-top: 1px solid #eaecf0 !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
        }
        .custom-pagination .ant-pagination-item {
            border-radius: 8px !important;
            border: none !important;
            margin: 0 2px !important;
            font-weight: 500 !important;
        }
        .custom-pagination .ant-pagination-item-active {
            background: #f9f5ff !important;
        }
        .custom-pagination .ant-pagination-item-active a {
            color: #7f56d9 !important;
        }
      `}</style>
    </div>
  )
}
