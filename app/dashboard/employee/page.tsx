'use client'
import { useEffect, useState } from 'react'
import { Button, Table, Tag, Avatar, Modal, Form, DatePicker, Select, Input, message } from 'antd'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import dayjs from 'dayjs'
import {
  HiOutlineSearch,
  HiOutlineDotsVertical,
  HiOutlineSun,
  HiOutlineBell,
  HiOutlineLockClosed,
  HiOutlineHeart,
  HiOutlineArrowNarrowDown,
  HiOutlineInbox,
  HiOutlineScale,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineTrash
} from 'react-icons/hi'
import { requestLeave, deleteLeavesPermanently } from '@/app/api/leaves'
import { useMyLeaves, queryKeys } from '@/lib/hooks'
import { useQueryClient } from '@tanstack/react-query'

const { RangePicker } = DatePicker
const { Option } = Select

export default function EmployeeDashboardPage() {
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend')
  const [isApplying, setIsApplying] = useState(false)
  const pageSize = 5

  const { data: result, isLoading: loading } = useMyLeaves(user?.id || '', {
    page: currentPage,
    pageSize,
    search,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    leaveType: typeFilter.length > 0 ? typeFilter : undefined,
    startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
    endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
    sortOrder: sortOrder
  })
  const leaves = result?.data || []
  const totalItems = result?.count || 0
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()



  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) return
    setIsDeleting(true)
    try {
      await deleteLeavesPermanently(selectedRowKeys.map(k => String(k)))
      message.success(`${selectedRowKeys.length} leave requests permanently deleted`)
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: queryKeys.myLeaves(user?.id || '') })
    } catch (err) {
      message.error('Failed to delete leave requests')
    } finally {
      setIsDeleting(false)
    }
  }

  const calculateDaysForType = (type: string) => {
    return leaves
      .filter(l => l.type === type && l.status === 'approved')
      .reduce((total, leave) => {
        const duration = dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1
        return total + duration
      }, 0)
  }

  const handleApplyLeave = async (values: any) => {
    if (!user?.id) return

    setIsApplying(true)
    const [start, end] = values.dates

    const leaveData = {
      employee_id: user.id,
      type: values.type,
      start_date: start.format('YYYY-MM-DD'),
      end_date: end.format('YYYY-MM-DD'),
      reason: values.reason
    }

    const { error } = await requestLeave(leaveData)

    if (error) {
      messageApi.error("Error submitting leave request: " + error.message)
    } else {
      messageApi.success("Leave request submitted successfully!")
      setIsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: queryKeys.myLeaves() })
    }
    setIsApplying(false)
  }

  const stats = [
    { title: 'Vacation', count: calculateDaysForType('Vacation').toString().padStart(2, '0'), icon: <HiOutlineSun />, bg: '#FFF4ED', color: '#F97316' },
    { title: 'Casual', count: calculateDaysForType('Casual').toString().padStart(2, '0'), icon: <HiOutlineBell />, bg: '#F5F3FF', color: '#7C3AED' },
    { title: 'Personal', count: calculateDaysForType('Personal').toString().padStart(2, '0'), icon: <HiOutlineLockClosed />, bg: '#EFF6FF', color: '#3B82F6' },
    { title: 'Sick', count: calculateDaysForType('Sick').toString().padStart(2, '0'), icon: <HiOutlineHeart />, bg: '#FEF2F2', color: '#EF4444' },
  ]

  const columns = [
    {
      title: <span className="uppercase tracking-wider text-[11px] font-bold text-[#667085]">Submission Date</span>,
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <span className="text-[14px] font-medium text-[#101828]">
          {dayjs(date).format('MM/DD/YYYY HH:mm')}
        </span>
      )
    },
    {
      title: <span className="uppercase tracking-wider text-[11px] font-bold text-[#667085]">From - to</span>,
      key: 'dates',
      render: (record: any) => (
        <div className="flex flex-col">
          <span className="text-[14px] text-[#475467] font-medium">
            {dayjs(record.start_date).format('MM/DD/YYYY')} to {dayjs(record.end_date).format('MM/DD/YYYY')}
          </span>
          <span className="text-[11px] text-[#98A2B3] font-medium uppercase mt-0.5">
            {dayjs(record.end_date).diff(dayjs(record.start_date), 'day') + 1} Days
          </span>
        </div>
      )
    },
    {
      title: <span className="uppercase tracking-wider text-[11px] font-bold text-[#667085]">Type</span>,
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let icon = <HiOutlineSun />;
        let color = '#F97316';
        if (type === 'Casual') { icon = <HiOutlineBell />; color = '#7C3AED'; }
        if (type === 'Personal') { icon = <HiOutlineLockClosed />; color = '#3B82F6'; }
        if (type === 'Sick') { icon = <HiOutlineHeart />; color = '#EF4444'; }
        return (
          <div className="flex items-center gap-2 px-2 py-1 rounded-full border w-fit" style={{ borderColor: color + '33', backgroundColor: color + '11' }}>
            <span className="text-[14px]" style={{ color }}>{icon}</span>
            <span className="text-[12px] font-bold" style={{ color }}>{type}</span>
          </div>
        )
      }
    },
    {
      title: <span className="uppercase tracking-wider text-[11px] font-bold text-[#667085]">Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'} className="rounded-full px-3 py-0.5 font-bold capitalize border-none">
          {status}
        </Tag>
      )
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {contextHolder}

      {/* Main Content Wrap */}
      <div className="flex flex-col lg:flex-row flex-1 p-4 md:p-8 pt-6 md:pt-10 gap-6 md:gap-10">

        {/* LEFT COLUMN: Main Dashboard Area */}
        <div className="flex-1 flex flex-col gap-6 md:gap-10 min-w-0">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-[28px] md:text-[30px] font-medium text-[#101828] font-['Inter'] m-0 p-0 leading-none">Home</h1>
            <div className="flex items-center w-full sm:w-auto">
              <div className="flex items-center bg-white border border-[#eaecf0] rounded-[12px] h-[44px] w-full sm:w-[300px] shadow-sm focus-within:border-[#7f56d9] focus-within:ring-4 focus-within:ring-[#7f56d9]/10 transition-all duration-200">
                <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
                  <HiOutlineSearch className="w-[20px] h-[20px] text-[#667085]" />
                </div>
                <input
                  type="text"
                  placeholder="Search Leaves..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#101828] placeholder:text-[#667085] font-medium font-['Inter'] pr-3"
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const newFilter = typeFilter.includes(stat.title)
                    ? typeFilter.filter(t => t !== stat.title)
                    : [...typeFilter, stat.title]
                  setTypeFilter(newFilter)
                  setCurrentPage(1)
                }}
                className={`p-6 rounded-[12px] border shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all cursor-pointer ${typeFilter.includes(stat.title)
                    ? 'border-[#7F56D9] bg-[#F9F5FF] ring-4 ring-[#7F56D9]/10'
                    : 'bg-white border-[#F2F4F7]'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-[#667085] uppercase tracking-widest">{stat.title}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[36px] font-bold text-[#101828] leading-none">{stat.count}</span>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm border border-[#F2F4F7]" style={{ backgroundColor: stat.bg, color: stat.color }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-[24px] border border-[#F2F4F7] shadow-sm flex flex-col overflow-hidden max-w-full">
            <div className="px-4 md:px-8 py-6 border-b border-[#eaecf0] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 min-h-[88px]">
              <h3 className="text-[18px] font-medium text-[#101828] font-['Inter'] mb-0 leading-[28px]">Latest Leaves</h3>
              
              <div className="flex flex-wrap items-center justify-end gap-2 w-full xl:w-auto">
                <Select
                  mode="multiple"
                  placeholder="Filter by Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-[150px] h-[38px] custom-filter-select-small"
                  maxTagCount="responsive"
                  allowClear
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' },
                  ]}
                />

                <Select
                  mode="multiple"
                  placeholder="Filter by Type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  className="w-[170px] h-[38px] custom-filter-select-small"
                  maxTagCount="responsive"
                  allowClear
                  options={[
                    { label: 'Vacation', value: 'Vacation' },
                    { label: 'Casual', value: 'Casual' },
                    { label: 'Personal', value: 'Personal' },
                    { label: 'Sick', value: 'Sick' },
                  ]}
                />

                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                  className="w-[240px] h-[38px] custom-filter-datepicker-small"
                />

                {selectedRowKeys.length > 0 && (
                  <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300 ml-2">
                    <Button 
                      onClick={handleDeleteSelected}
                      loading={isDeleting}
                      danger
                      className="h-[38px] px-4 rounded-xl font-bold flex items-center gap-2 border-none bg-rose-50 text-rose-600 hover:bg-rose-100"
                      icon={<HiOutlineTrash className="text-lg" />}
                    >
                      Delete ({selectedRowKeys.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 w-full overflow-x-auto">
              <div className="min-w-[800px]">
                <Table
                columns={columns}
                dataSource={leaves}
                onChange={(pagination, filters, sorter: any) => {
                  // Handle Pagination
                  if (pagination.current) setCurrentPage(pagination.current)

                  // Handle Filters
                  const status = filters.status ? filters.status as string[] : []
                  const type = filters.type ? filters.type as string[] : []

                  if (JSON.stringify(status) !== JSON.stringify(statusFilter) ||
                    JSON.stringify(type) !== JSON.stringify(typeFilter)) {
                    setCurrentPage(1)
                  }

                  setStatusFilter(status)
                  setTypeFilter(type)

                  // Handle Sorting
                  if (sorter.field === 'created_at' && sorter.order) {
                    setSortOrder(sorter.order)
                    setCurrentPage(1)
                  } else if (!sorter.order) {
                    // If sort is cleared, we default back to descend
                    setSortOrder('descend')
                    setCurrentPage(1)
                  }
                }}
                pagination={totalItems > pageSize ? {
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalItems,
                  size: 'small',
                  className: 'mt-4 px-8 mb-6'
                } : false}
                loading={loading}
                className="custom-table"
                rowKey="id"
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                }}
                locale={{
                  emptyText: (
                    <div className="py-20 flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <HiOutlineInbox className="text-4xl text-gray-300" />
                      </div>
                      <span className="text-gray-500 font-medium pb-2">No data found</span>
                    </div>
                  )
                }}
              />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Profile & Actions */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-8">

          {/* Profile Card */}
          <div className="bg-white rounded-[32px] p-8 border border-[#F2F4F7] shadow-sm flex flex-col items-center">
            <div className="relative mb-6">
              <Avatar
                size={120}
                src={profile?.avatar_url}
                className="border-8 border-gray-50 shadow-inner"
              >
                {dayjs().format('A')}
              </Avatar>
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-[24px] font-bold text-[#101828] mb-1">{profile?.user_name || 'Employee'}</h2>
              <p className="text-[14px] text-[#667085] font-semibold">{profile?.employee?.position || 'Team Member'}</p>
            </div>

            <div className="flex w-full gap-3">
              <Link href="/dashboard/employee/settings?tab=account" className="flex-1 no-underline">
                <Button block className="h-[44px] rounded-xl font-bold border-[#D0D5DD] text-[#344054] hover:border-[#7F56D9] hover:text-[#7F56D9]">
                  Settings
                </Button>
              </Link>
              <Link href="/dashboard/employee/settings?tab=profile" className="flex-1 no-underline">
                <Button block type="primary" className="h-[44px] rounded-xl font-bold bg-[#7F56D9] hover:bg-[#6941C6] border-none shadow-sm">
                  View profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white rounded-[24px] p-6 border border-[#F2F4F7] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[14px] font-bold text-[#101828]">Balance</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[48px] font-bold text-[#101828] leading-none">{profile?.employee?.vacation_balance ?? 0}</span>
              <div className="w-14 h-14 rounded-2xl bg-[#ECFDF3] flex items-center justify-center text-[#12B76A] text-2xl shadow-sm border border-[#D1FADF]">
                <HiOutlineScale />
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <Button
            type="primary"
            size="large"
            onClick={() => setIsModalOpen(true)}
            className="h-[60px] rounded-[16px] bg-[#7F56D9] hover:bg-[#6941C6] border-none text-[16px] font-bold shadow-lg shadow-indigo-100 flex items-center justify-center"
          >
            Apply for leave
          </Button>
        </div>
      </div>

      {/* Modal - Kept functional but updated styling */}
      <Modal
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        footer={null}
        width="95%"
        style={{ maxWidth: 500 }}
        centered
        closeIcon={null}
        className="fidelity-modal"
      >
        <div className="p-2">
          <div className="mb-8">
            <h2 className="text-[24px] font-bold text-[#101828] mb-2">Apply For Leave</h2>
            <p className="text-gray-500 text-sm">Fill in the details below to request your time off.</p>
          </div>

          <Form form={form} layout="vertical" onFinish={handleApplyLeave} requiredMark={false} className="gap-4 flex flex-col">
            <Form.Item label={<span className="font-bold text-gray-700">Leave Date</span>} name="dates" rules={[{ required: true }]}>
              <RangePicker className="w-full h-12 rounded-xl" />
            </Form.Item>

            <Form.Item label={<span className="font-bold text-gray-700">Type</span>} name="type" rules={[{ required: true }]}>
              <Select placeholder="Select type..." className="h-12 w-full rounded-xl custom-select">
                <Option value="Vacation">Vacation</Option>
                <Option value="Casual">Casual</Option>
                <Option value="Personal">Personal</Option>
                <Option value="Sick">Sick</Option>
              </Select>
            </Form.Item>

            <Form.Item label={<span className="font-bold text-gray-700">Description</span>} name="reason" rules={[{ required: true }]}>
              <Input.TextArea placeholder="Enter reason..." rows={4} className="rounded-xl p-4" />
            </Form.Item>

            <div className="flex gap-4 mt-4">
              <Button onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold border-gray-200">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isApplying} className="flex-1 h-12 rounded-xl font-bold bg-[#7F56D9] hover:bg-[#6941C6] border-none">
                Submit Request
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background: #F9FAFB !important;
          padding: 16px 32px !important;
          border-bottom: 1px solid #F2F4F7 !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          padding: 24px 32px !important;
          border-bottom: 1px solid #F2F4F7 !important;
        }
        .custom-table .ant-table-row:hover > td {
          background-color: #F9FAFB !important;
        }
        .fidelity-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 32px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        }
        .custom-select .ant-select-selector {
          border-radius: 12px !important;
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-picker {
          border-radius: 12px !important;
          padding: 12px 16px !important;
        }
        .custom-filter-select-small .ant-select-selector,
        .custom-filter-datepicker-small {
          height: 38px !important;
          border-radius: 10px !important;
          border-color: #eaecf0 !important;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05) !important;
          display: flex !important;
          align-items: center !important;
          background-color: white !important;
        }
        .custom-filter-datepicker-small .ant-picker-input > input {
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #101828 !important;
        }
        .custom-filter-datepicker-small .ant-picker-suffix {
          color: #667085 !important;
        }
      `}</style>
    </div>
  )
}

