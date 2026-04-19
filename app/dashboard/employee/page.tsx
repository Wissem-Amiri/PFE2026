'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/api/AuthContext'
import Link from 'next/link'
import dayjs from 'dayjs'
import {
  UserOutlined,
  SearchOutlined,
  EllipsisOutlined,
  LockFilled,
  MedicineBoxFilled,
  AlertFilled,
  SunFilled,
  BarChartOutlined,
  InboxOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { Button, Table, Tag, Avatar, Modal, Form, DatePicker, Select, Input, message } from 'antd'
import { getMyLeaves, requestLeave } from '@/api/conge'

const { RangePicker } = DatePicker
const { Option } = Select

export default function EmployeeDashboardPage() {
  const { profile, user } = useAuth()
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const loadLeaves = async () => {
    if (user?.id) {
      const { data } = await getMyLeaves(user.id)
      setLeaves(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLeaves()
  }, [user?.id])

  // Helper to calculate days taken per type (Approved or Pending)
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
      loadLeaves()
    }
    setLoading(false)
  }

  const CustomEmpty = () => (
    <div className="flex flex-col items-center justify-center py-[80px]">
      <div className="w-[64px] h-[64px] bg-[#f9fafb] border border-[#f2f4f7] rounded-[18px] flex items-center justify-center mb-4 shadow-sm">
        <InboxOutlined className="text-[#d0d5dd] text-[28px]" />
      </div>
      <span className="text-[14px] text-[#667085] font-medium">No data found</span>
    </div>
  )

  const stats = [
    { title: 'Vacation', count: calculateDaysForType('Vacation').toString().padStart(2, '0'), icon: <SunFilled />, color: '#FFF4ED', iconColor: '#F97316' },
    { title: 'Casual', count: calculateDaysForType('Casual').toString().padStart(2, '0'), icon: <AlertFilled />, color: '#F5F3FF', iconColor: '#7C3AED' },
    { title: 'Personal', count: calculateDaysForType('Personal').toString().padStart(2, '0'), icon: <LockFilled />, color: '#EFF6FF', iconColor: '#3B82F6' },
    { title: 'Sick', count: calculateDaysForType('Sick').toString().padStart(2, '0'), icon: <MedicineBoxFilled />, color: '#FEF2F2', iconColor: '#EF4444' },
  ]

  const columns = [
    {
      title: (
        <div className="flex items-center gap-1">
          SUBMISSION DATE <ArrowDownOutlined className="text-[10px]" />
        </div>
      ),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <span className="text-[13px] font-medium text-[#475467]">
          {new Date(date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '')}
        </span>
      )
    },
    {
      title: 'FROM - TO',
      key: 'duration',
      render: (record: any) => (
        <span className="text-[13px] text-[#475467] font-medium">
          {new Date(record.start_date).toLocaleDateString('en-US')} to {new Date(record.end_date).toLocaleDateString('en-US')}
        </span>
      )
    },
    {
      title: 'TYPE',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let icon = <SunFilled />;
        let color = '#F97316';
        if (type === 'Casual') { icon = <AlertFilled />; color = '#7C3AED'; }
        if (type === 'Personal') { icon = <LockFilled />; color = '#3B82F6'; }
        if (type === 'Sick') { icon = <MedicineBoxFilled />; color = '#EF4444'; }
        return (
          <div className="flex items-center gap-2">
            <span className="text-[12px]" style={{ color }}>{icon}</span>
            <span className="text-[13px] font-bold" style={{ color }}>{type}</span>
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
        if (status === 'approved') color = 'green'
        if (status === 'rejected') color = 'error'
        return (
          <Tag color={color} className="rounded-full px-3 py-0 pb-0.5 font-bold uppercase text-[9px] border-none shadow-sm capitalize">
            {status}
          </Tag>
        )
      }
    }
  ]

  return (
    <div className="flex-1 p-[32px] px-[40px] h-full overflow-y-auto bg-[#fcfcfd]">
      {contextHolder}
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-[32px]">
        <h1 className="text-[26px] font-black text-[#101828] mb-0 tracking-tight">Home</h1>
        <div className="w-[40px] h-[40px] flex items-center justify-center cursor-pointer text-[#667085] hover:bg-slate-50 rounded-full transition-all">
          <SearchOutlined className="text-[20px]" />
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px] mb-[32px]">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-[24px] rounded-[16px] border border-[#eaecf0] shadow-sm relative overflow-hidden group hover:border-[#7c3aed] transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[12px] font-extrabold text-[#667085] uppercase tracking-[0.1em]">{stat.title}</span>
              <EllipsisOutlined className="text-[#d0d5dd] cursor-pointer" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[34px] font-black text-[#101828]">{stat.count}</span>
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[18px]"
                style={{ backgroundColor: stat.color, color: stat.iconColor }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-[32px]">
        {/* ── MAIN CONTENT (TABLE) ── */}
        <div className="flex-1 xl:flex-[0.73]">
          <div className="bg-white rounded-[16px] border border-[#eaecf0] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="px-[24px] py-[22px] border-b border-[#eaecf0]">
              <h3 className="text-[16px] font-bold text-[#101828] mb-0">Latest Leaves</h3>
            </div>

            <div className="flex-1">
              <Table
                columns={columns}
                dataSource={leaves}
                pagination={false}
                loading={loading}
                className="pixel-perfect-table"
                rowKey="id"
                rowSelection={{ type: 'checkbox' }}
                locale={{ emptyText: <CustomEmpty /> }}
              />
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="w-full xl:w-[320px] xl:flex-[0.27] flex flex-col gap-[32px]">
          {/* Profile Card */}
          <div className="bg-white rounded-[20px] border border-[#eaecf0] shadow-sm p-[32px] flex flex-col items-center">
            <div className="relative mb-6">
              <Avatar
                size={96}
                src={profile?.avatar_url ?? undefined}
                icon={<UserOutlined />}
                className="border-[4px] border-white shadow-xl shadow-slate-100"
              />
            </div>
            <h2 className="text-[20px] font-black text-[#101828] mb-1">{profile?.user_name || 'Farouk Abichou'}</h2>
            <p className="text-[14px] font-bold text-[#667085] mb-[28px]">{profile?.employee?.position || 'Software Developer'}</p>

            <div className="flex gap-2 w-full">
              <Link href="/dashboard/employee/settings" className="flex-1">
                <Button block className="h-[44px] rounded-[10px] font-bold text-[#344054] border-[#d0d5dd] hover:border-[#7c3aed] hover:text-[#7c3aed]">Settings</Button>
              </Link>
              <Link href="/dashboard/employee/profile" className="flex-1">
                <Button block type="primary" className="h-[44px] rounded-[10px] font-bold bg-[#7C3AED] hover:bg-[#6D28D9] border-none shadow-md shadow-purple-50">View profile</Button>
              </Link>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white rounded-[20px] border border-[#eaecf0] shadow-sm p-[24px]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[14px] font-bold text-[#101828]">Balance</span>
              <EllipsisOutlined className="text-[#d0d5dd]" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[38px] font-black text-[#101828]">{profile?.employee?.vacation_balance ?? 0}</span>
              <div className="w-[52px] h-[52px] rounded-[14px] bg-[#dcfce7] flex items-center justify-center text-[#16a34a] text-[24px]">
                <BarChartOutlined className="rotate-90" />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-[52px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-[12px] font-black text-[15px] shadow-lg shadow-purple-100 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            Apply for leave
          </button>
        </div>
      </div>

      {/* ── APPLY LEAVE MODAL ── */}
      <Modal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        width={500}
        className="apply-leave-modal"
        centered
        closeIcon={false}
      >
        <div className="p-4">
          <div className="mb-6">
            <h2 className="text-[20px] font-black text-[#101828] mb-1">Apply For Leave</h2>
            <p className="text-[13px] text-[#667085] font-medium mb-0">Fill in the details below to request your time off.</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleApplyLeave}
            className="high-fidelity-form"
            requiredMark={false}
          >
            <Form.Item
              label={<span className="text-[13px] font-bold text-[#344054]">Leave Date</span>}
              name="dates"
              rules={[{ required: true, message: 'Please select your leave dates' }]}
              extra={<span className="text-[11px] text-[#667085] flex items-center gap-1 mt-1"><InfoCircleOutlined className="text-[10px]" /> This is a hint text to help user.</span>}
            >
              <RangePicker
                className="w-full h-[44px] rounded-[10px] border-[#d0d5dd]"
                placeholder={['Start Date', 'End Date']}
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-[13px] font-bold text-[#344054]">Type</span>}
              name="type"
              rules={[{ required: true, message: 'Please select leave type' }]}
              extra={<span className="text-[11px] text-[#667085] flex items-center gap-1 mt-1"><InfoCircleOutlined className="text-[10px]" /> This is a hint text to help user.</span>}
            >
              <Select placeholder="Select..." className="w-full h-[44px] rounded-[10px] items-center flex" suffixIcon={<ArrowDownOutlined className="text-[12px]" />}>
                <Option value="Vacation">Vacation</Option>
                <Option value="Casual">Casual</Option>
                <Option value="Personal">Personal</Option>
                <Option value="Sick">Sick</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="text-[13px] font-bold text-[#344054]">Description</span>}
              name="reason"
              rules={[{ required: true, message: 'Please provide a reason' }]}
              help={<span className="text-red-500 text-[11px] hidden">This is a error message.</span>}
            >
              <Input.TextArea
                placeholder="Type..."
                rows={4}
                className="rounded-[10px] border-[#d0d5dd] p-3 text-[14px]"
              />
            </Form.Item>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  form.resetFields()
                }}
                className="flex-1 h-[48px] rounded-[12px] font-black text-[#344054] border-[#d0d5dd] hover:border-[#7c3aed] hover:text-[#7c3aed]"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="flex-1 h-[48px] rounded-[12px] font-black bg-[#7C3AED] hover:bg-[#6D28D9] border-none shadow-md shadow-purple-100"
              >
                Apply For Leave
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

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
          padding: 20px 24px !important;
          border-bottom: 1px solid #f2f4f7 !important;
        }
        .pixel-perfect-table .ant-table-row:hover > td {
          background-color: #f9fafb !important;
        }
        .ant-table-placeholder {
          padding: 0 !important;
          border: none !important;
        }

        /* Modal styling */
        .apply-leave-modal .ant-modal-content {
          border-radius: 20px !important;
          padding: 24px !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
        }
        .high-fidelity-form .ant-form-item-label > label {
          height: auto !important;
        }
        .ant-select-selector {
          border-radius: 10px !important;
          border-color: #d0d5dd !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-picker {
          border-radius: 10px !important;
          border-color: #d0d5dd !important;
        }
      `}</style>
    </div>
  )
}
