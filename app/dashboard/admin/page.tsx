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

  const columns = [
    {
      title: 'SUBMISSION DATE',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="text-[14px] font-medium text-[#101828] uppercase">{dayjs(date).format('MM/DD/YYYY')}</span>
          <span className="text-[12px] text-[#667085]">{dayjs(date).format('HH:mm')}</span>
        </div>
      )
    },
    {
      title: 'APPLICANT',
      key: 'user',
      render: (record: any) => (
        <div className="flex items-center gap-[12px]">
          <Avatar
            size={40}
            src={record.user?.avatar_url}
            className="bg-[#c7b9da]"
          >
            {record.user?.user_name?.substring(0, 2).toUpperCase() || 'U'}
          </Avatar>
          <div className="text-[14px] font-medium text-[#101828]">{record.user?.user_name || 'Unknown'}</div>
        </div>
      )
    },
    {
      title: 'ACTIVITY',
      key: 'activity',
      render: (record: any) => {
        let label = record.details;

        return (
          <div className="flex items-center gap-2.5">
            <div className="bg-[#fffaeb] px-[8px] py-[2px] rounded-full flex items-center gap-1.5 border border-transparent shadow-sm">
                <img src="/assets/activity-check.svg" className="w-[14px] h-[14px]" alt="" />
                <span className="text-[12px] font-medium text-[#b54708] whitespace-nowrap">{label}</span>
            </div>
          </div>
        )
      }
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '#B54708'
        let bgColor = '#FFFAEB'
        if (status === 'approved' || status === 'accepted') {
            color = '#067647'
            bgColor = '#ECFDF3'
        }
        if (status === 'rejected') {
            color = '#B42318'
            bgColor = '#FEF3F2'
        }
        return (
          <div 
            style={{ backgroundColor: bgColor, color: color }}
            className="rounded-full px-2.5 py-0.5 font-medium text-[12px] capitalize inline-block border border-transparent"
          >
            {status}
          </div>
        )
      }
    }
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F9FAFB]">
      {/* Sidebar Placeholder (Space reserved to match Figma's x=243) */}
      
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 bg-white rounded-tl-[40px] pt-[32px] pb-[48px] overflow-y-auto">
        {/* Header section (3024:10913) */}
        <div className="px-[24px] flex justify-between items-center mb-[32px]">
          <h1 className="text-[30px] font-medium text-[#101828] leading-[38px] font-['Inter']">Home</h1>
          <div className="flex items-center gap-[12px]">
             <button className="p-[10px] rounded-[8px] hover:bg-gray-50 flex items-center justify-center transition-all">
                <img src="/assets/search.svg" className="w-[20px] h-[20px] opacity-70" alt="Search" />
             </button>
        </div>
      </div>

        {/* ── STATS (Strict Figma Structure 3024:10912) ── */}
        <div className="px-[24px] grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[32px]">
          {stats.map((stat, idx) => (
            <Link key={idx} href={stat.href} className="no-underline block group">
              <div className="bg-white p-[14.87px] h-[96.8px] rounded-[16px] border border-[#eaecf0] shadow-[0px_8px_16px_-4px_rgba(16,24,40,0.04)] group-hover:border-[#7f56d9] transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden">
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
            <h3 className="text-[18px] font-bold text-[#101828] font-['Inter'] mb-0 leading-[28px]">Recent activity</h3>
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
                      <img src="/assets/arrow-left.svg" className="w-[12px] h-[12px] rotate-[270deg] opacity-60" alt="Sort" />
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
                    return (
                      <div className="flex items-center">
                        <div className={`px-[12px] py-[4px] rounded-full flex items-center gap-[6px] border border-transparent ${isLeave ? 'bg-[#fffaeb]' : 'bg-[#f9f5ff]'}`}>
                            {isLeave && <img src="/assets/vacation.svg" className="w-[14px] h-[14px]" alt="" />}
                            {!isLeave && <img src="/assets/activity-check.svg" className="w-[14px] h-[14px]" alt="" />}
                            <span className={`text-[12px] font-medium whitespace-nowrap leading-[18px] font-['Inter'] ${isLeave ? 'text-[#b54708]' : 'text-[#6941c6]'}`}>
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
              <button className="h-[40px] px-[16px] rounded-[8px] border border-[#d0d5dd] bg-white text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-all shadow-sm font-['Inter']">Settings</button>
              <button className="h-[40px] px-[16px] rounded-[8px] bg-[#7f56d9] text-[14px] font-medium text-white hover:bg-[#6941c6] transition-all shadow-sm font-['Inter']">View profile</button>
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
