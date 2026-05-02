'use client'
import { useEffect, useState, useMemo } from 'react'
import { getAllUsers, getProfile } from '@/api/profile'
import { getAllLeavesDetailed } from '@/api/leaves'
import { getAllApplicationsDetailed } from '@/api/applications'
import { useAuth } from '@/api/AuthContext'
import { archiveLeaves } from '@/api/leaves'
import { archiveApplications } from '@/api/applications'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/hooks'
import Link from 'next/link'
import type { FullProfile } from '@/api/database.types'
import {
  Avatar,
  Table,
  Tag,
  Tooltip,
  Button,
  message,
  Pagination,
  DatePicker
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
  HiOutlineHeart,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi'
import dayjs from 'dayjs'

import { useLeaves, useApplications } from '@/api/hooks'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [adminProfile, setAdminProfile] = useState<FullProfile | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const showLeaves = typeFilter.length === 0 || typeFilter.includes('Leave requests');
  const showRegistrationRequests = typeFilter.includes('Registration requests');
  const showJobSubmissions = typeFilter.length === 0 || typeFilter.includes('Job submissions');
  const fetchApplications = showJobSubmissions || showRegistrationRequests;
  
  let applicationsStatus = statusFilter.length > 0 ? statusFilter : undefined;
  if (!showJobSubmissions && showRegistrationRequests) {
    if (applicationsStatus) {
      applicationsStatus = applicationsStatus.includes('pending') ? ['pending'] : ['__NONE__'];
    } else {
      applicationsStatus = ['pending'];
    }
  }

  const { data: leavesResult, isLoading: leavesLoading } = useLeaves({ 
    page: 1, 
    pageSize: showLeaves ? 50 : 0, 
    search,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
    endDate: dateRange?.[1]?.format('YYYY-MM-DD')
  })
  const { data: applicationsResult, isLoading: applicationsLoading } = useApplications({ 
    page: 1, 
    pageSize: fetchApplications ? 50 : 0, 
    search,
    status: applicationsStatus,
    startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
    endDate: dateRange?.[1]?.format('YYYY-MM-DD')
  })

  const leaves = showLeaves ? (leavesResult?.data || []) : [];
  const applications = fetchApplications ? (applicationsResult?.data || []) : [];

  const loading = leavesLoading || applicationsLoading
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // Reset to first page when searching to avoid empty states
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

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
    ...applications.map(c => ({
      id: c.id,
      date: c.applied_at,
      type: 'application',
      user: c.candidate?.user,
      details: `Applied for ${c.job?.title}`,
      status: c.status
    }))
  ].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())

  const pageSize = 3
  const paginatedActivities = useMemo(() => {
    return activities.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    )
  }, [activities, currentPage])


  const stats = [
    {
      title: 'Registration requests',
      count: applications.filter(c => c.status === 'pending').length.toString(),
      href: '/dashboard/admin/registrations'
    },
    {
      title: 'Leave requests',
      count: leaves.filter(l => l.status === 'pending').length.toString(),
      href: '/dashboard/admin/leaves'
    },
    {
      title: 'Job submissions',
      count: applications.length.toString(),
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

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) return
    setIsDeleting(true)
    
    try {
      const leaveIds = selectedRowKeys
        .filter(key => String(key).startsWith('leave-'))
        .map(key => String(key).replace('leave-', ''))
      
      const applicationIds = selectedRowKeys
        .filter(key => String(key).startsWith('application-'))
        .map(key => String(key).replace('application-', ''))

      if (leaveIds.length > 0) {
        await archiveLeaves(leaveIds)
      }
      if (applicationIds.length > 0) {
        await archiveApplications(applicationIds)
      }

      message.success(`${selectedRowKeys.length} activity items deleted`)
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves })
      queryClient.invalidateQueries({ queryKey: queryKeys.applications })
    } catch (err) {
      message.error('Failed to delete activities')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FCFCFD]">
      {/* Sidebar Placeholder (Space reserved to match Figma's x=243) */}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 bg-[#FCFCFD] lg:rounded-tl-[40px] pt-[24px] md:pt-[32px] pb-[48px] overflow-y-auto no-scrollbar min-w-0">
        {/* Header section (3024:10913) */}
        <div className="px-4 md:px-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-[32px]">
          <h1 className="text-[28px] md:text-[30px] font-medium text-[#101828] font-['Inter'] m-0 p-0 leading-none">Home</h1>
          <div className="flex items-center w-full sm:w-auto">
            {activities.length > 3 && (
              <div className="relative flex items-center w-full sm:w-auto">
                <div className="flex items-center bg-white border border-[#eaecf0] rounded-[12px] h-[44px] w-full sm:w-[300px] shadow-sm focus-within:border-[#7f56d9] focus-within:ring-4 focus-within:ring-[#7f56d9]/10 transition-all duration-200">
                  <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
                    <img src="/assets/search.svg" className="w-[20px] h-[20px] opacity-60" alt="Search" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#101828] placeholder:text-[#667085] font-medium font-['Inter'] pr-3"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── STATS (Strict Figma Structure 3024:10912) ── */}
        <div className="px-4 md:px-[24px] grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[32px]">
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
        <div className="mx-4 md:mx-[24px] bg-white rounded-[16px] border border-[#eaecf0] shadow-[0px_8px_16px_-4px_rgba(16,24,40,0.04)] overflow-hidden mb-[48px]">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#eaecf0] flex flex-col sm:flex-row justify-between items-start sm:items-center min-h-[72px] gap-4">
            <h3 className="text-[18px] font-medium text-[#101828] font-['Inter'] mb-0 leading-[28px]">Recent activity</h3>
            
            {selectedRowKeys.length > 0 && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <span className="text-[14px] text-[#667085] font-medium">{selectedRowKeys.length} selected</span>
                <button 
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="h-[36px] px-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[13px] font-semibold flex items-center gap-2 hover:bg-rose-100 transition-all disabled:opacity-50"
                >
                  <HiOutlineTrash className="text-[16px]" />
                  Delete selected
                </button>
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="min-w-[800px]">
              <Table
                columns={[
                // The selection column is now handled by Ant Design's rowSelection prop below
                // We'll keep the custom padding for the first column via styles or by keeping this but with correct selection logic
                {
                  title: <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider ml-6">Submission Date</span>,
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
                  title: <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Date</span>,
                  key: 'date_range',
                  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                    <div className="p-4 bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col gap-3">
                      <DatePicker.RangePicker
                        value={dateRange}
                        onChange={(dates) => {
                          setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                        }}
                        className="custom-range-picker"
                      />
                      <div className="flex justify-between items-center mt-2 border-t pt-3">
                        <button
                          onClick={() => {
                            setDateRange(null)
                            confirm()
                          }}
                          className="text-[12px] text-gray-500 font-medium hover:text-red-500 transition-colors"
                        >
                          Reset
                        </button>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => confirm()}
                          className="bg-[#7C3AED] hover:bg-[#6D28D9] border-none rounded-lg px-4"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ),
                  filterIcon: (filtered: boolean) => (
                    <CalendarOutlined className={`text-[16px] ${filtered ? 'text-[#7C3AED]' : 'text-gray-400'}`} />
                  ),
                  render: (record: any) => (
                    <span className="text-[14px] text-[#667085] font-medium">
                      {record.type === 'leave'
                        ? `${dayjs(record.date).format('MM/DD/YYYY')} to ${dayjs(record.date).add(2, 'day').format('MM/DD/YYYY')}`
                        : `${dayjs(record.date).format('MM/DD/YYYY')} ${dayjs(record.date).format('HH:mm')}`}
                    </span>
                  )
                },
                {
                  title: <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Activity</span>,
                  key: 'activity',
                  filters: [
                    { text: 'Registration requests', value: 'Registration requests' },
                    { text: 'Leave requests', value: 'Leave requests' },
                    { text: 'Job submissions', value: 'Job submissions' },
                  ],
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
                },
                {
                  title: <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Status</span>,
                  dataIndex: 'status',
                  key: 'status',
                  filters: [
                    { text: 'Pending', value: 'pending' },
                    { text: 'Approved', value: 'approved' },
                    { text: 'Rejected', value: 'rejected' },
                    { text: 'Accepted', value: 'accepted' },
                  ],
                  render: (status: string) => (
                    <Tag color={status === 'approved' || status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'warning'} className="rounded-full px-3 py-0.5 font-bold capitalize border-none">
                      {status}
                    </Tag>
                  )
                }
              ]}
              dataSource={paginatedActivities}
              pagination={false}
              onChange={(pagination, filters) => {
                setTypeFilter(filters.activity as string[] || []);
                setStatusFilter(filters.status as string[] || []);
              }}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
                columnWidth: 64,
              }}
              className="figma-dashboard-table decoration-table"
              rowKey={(record) => `${record.type}-${record.id}`}
              locale={{ emptyText: <CustomEmpty /> }}
            />
            </div>
          </div>

          {/* ── CUSTOM PAGINATION (Matching Screenshot) ── */}
          {activities.length > 3 && (
            <div className="px-4 md:px-6 py-4 border-t border-[#EAECF0] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-[14px] py-[8px] border border-[#D0D5DD] rounded-[8px] bg-white text-[14px] font-semibold text-[#344054] shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <HiOutlineChevronLeft className="text-[18px]" />
                Previous
              </button>

              <Pagination
                current={currentPage}
                total={activities.length}
                pageSize={3}
                onChange={page => setCurrentPage(page)}
                showSizeChanger={false}
                itemRender={(page, type, originalElement) => {
                  if (type === 'prev' || type === 'next') return null;
                  return originalElement;
                }}
                className="custom-center-pagination"
              />

              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(activities.length / 3), prev + 1))}
                disabled={currentPage === Math.ceil(activities.length / 3)}
                className="flex items-center gap-2 px-[14px] py-[8px] border border-[#D0D5DD] rounded-[8px] bg-white text-[14px] font-semibold text-[#344054] shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <HiOutlineChevronRight className="text-[18px]" />
              </button>
            </div>
          )}
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
          font-weight: 700 !important;
          padding: 16px 24px !important;
          border-bottom: 1px solid #eaecf0 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
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
        .ant-pagination-item-active a {
            color: #7f56d9 !important;
        }
        
        /* Premium Ant Design Pagination Styling - Centered Numbers */
        .custom-center-pagination {
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
        }
        .custom-center-pagination .ant-pagination-item {
          border-radius: 8px !important;
          border: none !important;
          background: transparent !important;
          font-family: 'Inter', sans-serif !important;
          font-weight: 500 !important;
          margin: 0 4px !important;
          min-width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          transition: all 0.2s !important;
        }
        .custom-center-pagination .ant-pagination-item a {
          color: #667085 !important;
        }
        .custom-center-pagination .ant-pagination-item:hover {
          background: #F9F5FF !important;
        }
        .custom-center-pagination .ant-pagination-item-active {
          background: #7F56D9 !important;
          box-shadow: 0px 4px 8px rgba(127, 86, 217, 0.25) !important;
        }
        .custom-center-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
