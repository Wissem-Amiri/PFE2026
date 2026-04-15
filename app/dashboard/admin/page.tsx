'use client'
import { useEffect, useState } from 'react'
import { getAllUsers, getProfile } from '@/lib/profileService'
import { getAllLeavesDetailed } from '@/lib/congeService'
import { getAllCandidaturesDetailed } from '@/lib/candidatureService'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import type { FullProfile } from '@/lib/database.types'
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

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [adminProfile, setAdminProfile] = useState<FullProfile | null>(null)
  const [users, setUsers] = useState<FullProfile[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [usersRes, leavesRes, candidaturesRes] = await Promise.all([
        getAllUsers(),
        getAllLeavesDetailed(),
        getAllCandidaturesDetailed()
      ])

      setUsers(usersRes.data ?? [])
      setLeaves(leavesRes.data ?? [])
      setCandidatures(candidaturesRes.data ?? [])

      if (user?.id) {
        const { data } = await getProfile(user.id)
        setAdminProfile(data)
      }

      setLoading(false)
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
      title: 'Active Employees', 
      count: users.filter(u => u.role === 'employee').length.toString().padStart(2, '0'), 
      icon: <UserOutlined />, 
      color: '#F5F3FF', 
      iconColor: '#7C3AED',
      sub: 'Total team members',
      href: '/dashboard/admin/employee'
    },
    { 
      title: 'Leave requests', 
      count: leaves.filter(l => l.status === 'pending').length.toString().padStart(2, '0'), 
      icon: <CalendarOutlined />, 
      color: '#FFF4ED', 
      iconColor: '#F97316',
      sub: `${leaves.filter(l => l.status === 'pending').length} action required`,
      href: '/dashboard/admin/leaves'
    },
    { 
      title: 'Job submissions', 
      count: candidatures.filter(c => c.status === 'pending').length.toString().padStart(2, '0'), 
      icon: <SolutionOutlined />, 
      color: '#EFF6FF', 
      iconColor: '#3B82F6',
      sub: `${candidatures.filter(c => c.status === 'pending').length} new submissions`,
      href: '/dashboard/admin/registrations'
    },
  ]

  const columns = [
    {
      title: 'SUBMISSION DATE',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-[#101828]">{dayjs(date).format('MM/DD/YYYY')}</span>
          <span className="text-[12px] text-[#667085] font-medium">{dayjs(date).format('HH:mm')}</span>
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
            icon={<UserOutlined />}
            className="border-2 border-white shadow-sm ring-1 ring-slate-100"
          />
          <div className="text-[14px] font-bold text-[#101828]">{record.user?.user_name || 'Unknown'}</div>
        </div>
      )
    },
    {
      title: 'ACTIVITY',
      key: 'activity',
      render: (record: any) => {
        let icon = <CheckCircleOutlined />;
        let color = '#7C3AED';
        let bgColor = '#F5F3FF';
        let label = record.details;

        if (record.type === 'leave') {
          if (record.leaveType === 'Vacation') { icon = <SunFilled />; color = '#F97316'; bgColor = '#FFF4ED'; }
          else if (record.leaveType === 'Casual') { icon = <AlertFilled />; color = '#7C3AED'; bgColor = '#F5F3FF'; }
          else if (record.leaveType === 'Personal') { icon = <LockFilled />; color = '#3B82F6'; bgColor = '#EFF6FF'; }
          else if (record.leaveType === 'Sick') { icon = <MedicineBoxFilled />; color = '#EF4444'; bgColor = '#FEF2F2'; }
        } else if (record.type === 'registration') {
          icon = <UserOutlined />; color = '#7C3AED'; bgColor = '#F5F3FF';
        } else if (record.type === 'candidature') {
          icon = <SolutionOutlined />; color = '#3B82F6'; bgColor = '#EFF6FF';
        }

        return (
          <div className="flex items-center gap-2.5">
            <div
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[12px]"
              style={{ backgroundColor: bgColor, color: color }}
            >
              {icon}
            </div>
            <span className="text-[13px] font-bold text-[#475467]">{label}</span>
          </div>
        )
      }
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'orange'
        if (status === 'approved' || status === 'accepted') color = 'green'
        if (status === 'rejected') color = 'error'
        return (
          <Tag color={color} className="rounded-full px-3 font-black uppercase text-[9px] border-none shadow-sm capitalize">
            {status}
          </Tag>
        )
      }
    }
  ]

  const CustomEmpty = () => (
    <div className="flex flex-col items-center justify-center py-[60px]">
      <div className="w-[64px] h-[64px] bg-[#f9fafb] border border-[#f2f4f7] rounded-[18px] flex items-center justify-center mb-4 shadow-sm">
        <InboxOutlined className="text-[#d0d5dd] text-[28px]" />
      </div>
      <span className="text-[14px] text-[#667085] font-medium">No recent activity</span>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[#fcfcfd]">
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 p-[32px] px-[40px] overflow-y-auto">
        <div className="flex justify-between items-center mb-[32px]">
          <h1 className="text-[26px] font-black text-[#101828] tracking-tight leading-none">Home</h1>
          <div className="flex items-center gap-[12px] px-[14px] py-[10px] border border-[#eaecf0] rounded-[12px] bg-white shadow-sm w-[360px] focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <SearchOutlined className="text-[#667085]" />
            <input
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none outline-none text-[14px] font-medium w-full text-[#101828] placeholder:text-[#98a2b3]"
            />
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] mb-[32px]">
          {stats.map((stat, idx) => (
            <Link key={idx} href={stat.href} className="no-underline block">
              <div className="bg-white p-[24px] rounded-[20px] border border-[#eaecf0] shadow-sm group hover:border-[#7c3aed] transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[12px] font-black text-[#667085] uppercase tracking-[0.1em]">{stat.title}</span>
                  <EllipsisOutlined className="text-[#d0d5dd] group-hover:text-[#7c3aed]" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[34px] font-black text-[#101828]">{stat.count}</span>
                  <div 
                    className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-[20px]"
                    style={{ backgroundColor: stat.color, color: stat.iconColor }}
                  >
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-3 text-[12px] text-[#667085] font-medium">{stat.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-[20px] border border-[#eaecf0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#eaecf0] flex justify-between items-center">
            <h3 className="text-[17px] font-black text-[#101828] mb-0">Recent activity</h3>
            <button className="flex items-center gap-2 text-[13px] font-bold text-[#7c3aed] hover:gap-3 transition-all cursor-pointer bg-transparent border-none">
              View detailed reports <ArrowRightOutlined />
            </button>
          </div>

          <Table
            columns={columns}
            dataSource={filteredActivities}
            pagination={{ pageSize: 8, hideOnSinglePage: true, position: ['bottomCenter'] }}
            loading={loading}
            className="pixel-perfect-table"
            rowKey={(record) => `${record.type}-${record.id}`}
            locale={{ emptyText: <CustomEmpty /> }}
          />
        </div>
      </div>

      {/* ── RIGHT PANEL (Admin Profile) ── */}
      <div className="w-full lg:w-[320px] bg-white border-l border-[#eaecf0] p-[32px] flex flex-col items-center">
        <div className="sticky top-[32px] w-full flex flex-col items-center">
          <div className="relative mb-[24px]">
            <Avatar
              size={120}
              src={adminProfile?.avatar_url}
              icon={<UserOutlined />}
              className="border-[4px] border-white shadow-xl ring-1 ring-slate-100"
            />
            <div className="absolute bottom-1 right-1 w-[24px] h-[24px] bg-green-500 border-[3px] border-white rounded-full"></div>
          </div>

          <h2 className="text-[22px] font-black text-[#101828] mb-1">{adminProfile?.user_name || 'Admin'}</h2>
          <p className="text-[14px] text-[#667085] font-bold uppercase tracking-wider mb-8">System Administrator</p>

          <div className="w-full grid grid-cols-2 gap-3 mb-[32px]">
            <button className="h-[44px] rounded-[12px] border border-[#d0d5dd] bg-white text-[14px] font-bold text-[#344054] hover:bg-slate-50 transition-all shadow-sm">Settings</button>
            <button className="h-[44px] rounded-[12px] bg-[#7c3aed] text-[14px] font-bold text-white hover:bg-[#6d28d9] transition-all shadow-md">View profile</button>
          </div>

          <div className="w-full space-y-[24px]">
            <div className="p-5 rounded-[20px] bg-[#f9fafb] border border-[#eaecf0]">
              <div className="text-[11px] font-black text-[#667085] uppercase mb-4">Quick Shortcuts</div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[14px] font-bold text-[#344054] hover:text-[#7c3aed] cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#eaecf0] shadow-sm flex items-center justify-center group-hover:bg-[#f5f3ff]"><CheckCircleOutlined /></div>
                  Review Registrations
                </div>
                <div className="flex items-center gap-3 text-[14px] font-bold text-[#344054] hover:text-[#7c3aed] cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#eaecf0] shadow-sm flex items-center justify-center group-hover:bg-[#f5f3ff]"><FileSearchOutlined /></div>
                  Audit Logs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .pixel-perfect-table .ant-table-thead > tr > th {
          background: #fcfcfd !important;
          color: #667085 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          font-weight: 800 !important;
          letter-spacing: 0.1em !important;
          padding: 18px 24px !important;
          border-bottom: 2px solid #f2f4f7 !important;
        }
        .pixel-perfect-table .ant-table-tbody > tr > td {
          padding: 18px 24px !important;
          border-bottom: 1px solid #f2f4f7 !important;
        }
        .pixel-perfect-table .ant-table-row:hover > td {
          background-color: #f9fafb !important;
        }
        .ant-table-pagination {
           margin: 24px 0 !important;
        }
      `}</style>
    </div>
  )
}
