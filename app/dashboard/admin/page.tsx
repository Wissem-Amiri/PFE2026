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
    <div className="flex flex-col lg:flex-row min-h-screen bg-transparent">
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 p-[32px] overflow-y-auto">
        <div className="flex justify-between items-center mb-[32px]">
          <h1 className="text-[30px] font-medium text-[#101828]">Home</h1>
          <div className="relative group">
            <img src="/assets/search.svg" className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] opacity-50" alt="search" />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-[44px] pr-[16px] py-[10px] border border-[#eaecf0] rounded-[8px] bg-white text-[14px] w-[320px] focus:outline-none focus:ring-2 focus:ring-[#7f56d9]/20 transition-all placeholder:text-[#98a2b3] font-medium shadow-sm"
            />
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[32px]">
          {stats.map((stat, idx) => (
            <Link key={idx} href={stat.href} className="no-underline block group">
              <div className="bg-white p-[24px] rounded-[8px] border border-[#eaecf0] shadow-sm group-hover:border-[#7f56d9] transition-all cursor-pointer h-full relative overflow-hidden">
                <div className="flex justify-between items-start mb-[8px]">
                  <span className="text-[14px] font-semibold text-[#101828]">{stat.title}</span>

                </div>
                <div className="flex items-end h-[40px]">
                  <span className="text-[36px] font-semibold text-[#101828] leading-none tracking-tight">{stat.count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-[8px] border border-[#eaecf0] shadow-sm overflow-hidden mb-[48px]">
          <div className="px-6 py-5 border-b border-[#eaecf0] flex justify-between items-center">
            <h3 className="text-[18px] font-medium text-[#101828] mb-0">Recent activity</h3>
          </div>

          <Table
            columns={columns}
            dataSource={filteredActivities}
            pagination={{ 
                pageSize: 10, 
                hideOnSinglePage: true, 
                position: ['bottomCenter'],
                className: 'custom-pagination'
            }}
            loading={loading}
            className="figma-dashboard-table"
            rowKey={(record) => `${record.type}-${record.id}`}
            locale={{ emptyText: <CustomEmpty /> }}
          />
        </div>
      </div>

      {/* ── RIGHT PANEL (Admin Profile) ── */}
      <div className="w-full lg:w-[296px] bg-transparent p-[32px] lg:pt-[40px] flex flex-col items-center">
        <div className="sticky top-[40px] w-full flex flex-col items-center">
          <div className="relative mb-[24px]">
             <div className="ring-[4px] ring-white shadow-lg rounded-full">
                <Avatar
                size={160}
                src={adminProfile?.avatar_url}
                className="bg-[#c7b9da]"
                >
                    {adminProfile?.user_name?.substring(0, 2).toUpperCase() || 'AD'}
                </Avatar>
             </div>
          </div>

          <h2 className="text-[24px] font-medium text-[#101828] mb-1">{adminProfile?.user_name || 'Admin'}</h2>
          <p className="text-[16px] text-[#667085] font-normal mb-8 text-center">{adminProfile?.role === 'admin' ? 'System Administrator' : 'Admin'}</p>

          <div className="flex items-center gap-[12px] w-full mb-[40px]">
            <button className="flex-1 h-[44px] rounded-[8px] border border-[#d0d5dd] bg-white text-[14px] font-medium text-[#344054] hover:bg-slate-50 transition-all shadow-sm">Settings</button>
            <button className="flex-1 h-[44px] rounded-[8px] bg-[#7f56d9] text-[14px] font-medium text-white hover:bg-[#6941c6] transition-all shadow-sm">View profile</button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .figma-dashboard-table .ant-table-thead > tr > th {
          background: #f9fafb !important;
          color: #667085 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          padding: 12px 24px !important;
          border-bottom: 1px solid #eaecf0 !important;
        }
        .figma-dashboard-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid #eaecf0 !important;
        }
        .figma-dashboard-table .ant-table-row:hover > td {
          background-color: #f9fafb !important;
        }
        .custom-pagination {
          margin: 16px 0 !important;
        }
        .custom-pagination .ant-pagination-item-active {
            border-color: #7f56d9 !important;
            background: #f9f5ff !important;
        }
        .custom-pagination .ant-pagination-item-active a {
            color: #6941c6 !important;
        }
      `}</style>
    </div>
  )
}
