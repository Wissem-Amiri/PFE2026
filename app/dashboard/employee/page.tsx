'use client'
import { useEffect, useState } from 'react'
import { Button, Table, Tag, Avatar, Modal, Form, DatePicker, Select, Input, message } from 'antd'
import { useAuth } from '@/api/AuthContext'
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
  HiOutlineScale
} from 'react-icons/hi'
import { requestLeave } from '@/api/conge'
import { useMyLeaves, queryKeys } from '@/api/hooks'
import { useQueryClient } from '@tanstack/react-query'

const { RangePicker } = DatePicker
const { Option } = Select

export default function EmployeeDashboardPage() {
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  
  const { data: result, isLoading: loading } = useMyLeaves(user?.id || '', { page: currentPage, pageSize })
  const leaves = result?.data || []
  const totalItems = result?.count || 0
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()



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

    setLoading(true)
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
      queryClient.invalidateQueries({ queryKey: queryKeys.myLeaves })
    }
    setLoading(false)
  }

  const stats = [
    { title: 'Vacation', count: calculateDaysForType('Vacation').toString().padStart(2, '0'), icon: <HiOutlineSun />, bg: '#FFF4ED', color: '#F97316' },
    { title: 'Casual', count: calculateDaysForType('Casual').toString().padStart(2, '0'), icon: <HiOutlineBell />, bg: '#F5F3FF', color: '#7C3AED' },
    { title: 'Personal', count: calculateDaysForType('Personal').toString().padStart(2, '0'), icon: <HiOutlineLockClosed />, bg: '#EFF6FF', color: '#3B82F6' },
    { title: 'Sick', count: calculateDaysForType('Sick').toString().padStart(2, '0'), icon: <HiOutlineHeart />, bg: '#FEF2F2', color: '#EF4444' },
  ]

  const columns = [
    {
      title: (
        <div className="flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold text-[#667085]">
          Submission Date <HiOutlineArrowNarrowDown className="text-xs" />
        </div>
      ),
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
      key: 'duration',
      render: (record: any) => (
        <span className="text-[14px] text-[#475467] font-medium">
          {dayjs(record.start_date).format('MM/DD/YYYY')} to {dayjs(record.end_date).format('MM/DD/YYYY')}
        </span>
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
      <div className="flex flex-1 p-8 pt-10 gap-10">

        {/* LEFT COLUMN: Main Dashboard Area */}
        <div className="flex-1 flex flex-col gap-10 min-w-0">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-[32px] font-bold text-[#101828] m-0">Home</h1>
            <div className="p-2 hover:bg-gray-50 rounded-full cursor-pointer transition-colors">
              <HiOutlineSearch className="text-2xl text-[#667085]" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[12px] border border-[#F2F4F7] shadow-sm flex flex-col gap-4 group hover:shadow-md transition-shadow">
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
          <div className="bg-white rounded-[24px] border border-[#F2F4F7] shadow-sm flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-[#F2F4F7]">
              <h3 className="text-[18px] font-bold text-[#101828] m-0">Latest Leaves</h3>
            </div>
            <div className="flex-1">
              <Table
                columns={columns}
                dataSource={leaves}
                pagination={totalItems > pageSize ? {
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalItems,
                  onChange: (page) => setCurrentPage(page),
                  size: 'small',
                  className: 'mt-4'
                } : false}
                loading={loading}
                className="custom-table"
                rowSelection={{ type: 'checkbox' }}
                rowKey="id"
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

        {/* RIGHT COLUMN: Profile & Actions */}
        <div className="w-[340px] shrink-0 flex flex-col gap-8">

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
              <h2 className="text-[24px] font-bold text-[#101828] mb-1">{profile?.user_name || 'Farouck Abichou'}</h2>
              <p className="text-[14px] text-[#667085] font-semibold">{profile?.employee?.position || 'Software Developer'}</p>
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
              <HiOutlineDotsVertical className="text-[#D0D5DD]" />
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
        width={500}
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
              <Button type="primary" htmlType="submit" loading={loading} className="flex-1 h-12 rounded-xl font-bold bg-[#7F56D9] hover:bg-[#6941C6] border-none">
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
      `}</style>
    </div>
  )
}
