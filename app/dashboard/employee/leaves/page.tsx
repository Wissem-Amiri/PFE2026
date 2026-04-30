'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/api/AuthContext'
import { Table, Button, Modal, Form, Select, DatePicker, Input, Tag, message, Tooltip } from 'antd'
import { PlusOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { getMyLeaves, requestLeave } from '@/api/conge'
import type { Conge } from '@/api/database.types'

const { RangePicker } = DatePicker
const { TextArea } = Input

export default function EmployeeLeavesPage() {
  const { user, profile } = useAuth()
  const [leaves, setLeaves] = useState<Conge[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const fetchLeaves = async () => {
    if (!user?.id) return
    setLoading(true)
    const { data } = await getMyLeaves(user.id)
    setLeaves(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaves()
  }, [user?.id])

  const handleRequestLeave = async (values: any) => {
    if (!user?.id) return
    setSubmitting(true)

    const { dates, type, reason } = values
    const [start, end] = dates

    const { error } = await requestLeave({
      employee_id: user.id,
      type,
      start_date: start.format('YYYY-MM-DD'),
      end_date: end.format('YYYY-MM-DD'),
      reason
    })

    setSubmitting(false)

    if (error) {
      message.error('Failed to submit leave request')
    } else {
      message.success('Leave request submitted successfully')
      setIsModalVisible(false)
      form.resetFields()
      fetchLeaves()
    }
  }

  const columns = [
    {
      title: 'Leave Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <span className="font-semibold text-slate-700">{text}</span>,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => <span>{new Date(date).toLocaleDateString('en-US')}</span>,
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => <span>{new Date(date).toLocaleDateString('en-US')}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Conge) => {
        let color = 'gold'
        if (status === 'approved') color = 'green'
        if (status === 'rejected') color = 'red'
        return (
          <div className="flex items-center gap-2">
            <Tag color={color} className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px] m-0">
              {status}
            </Tag>
            {status === 'rejected' && record.rejection_reason && (
              <Tooltip title={`Reason: ${record.rejection_reason}`}>
                <InfoCircleOutlined className="text-red-500 cursor-help" />
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: 'Submitted On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span className="text-slate-400 text-xs">{new Date(date).toLocaleDateString('en-US')}</span>,
    },
  ]

  return (
    <div className="p-[28px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 mb-1">My Leaves</h1>
          <p className="text-slate-500 text-sm">Track and manage your leave requests.</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          className="!bg-[#7c3aed] !h-[42px] rounded-lg font-semibold shadow-md shadow-purple-100"
        >
          Request Leave
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={leaves}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          className="custom-table"
        />
      </div>

      {/* Request Modal */}
      <Modal
        title={
          <div className="pt-2 px-1">
            <h3 className="text-lg font-bold text-slate-900">Request New Leave</h3>
            <p className="text-slate-400 text-sm font-normal">Please provide details for your leave request.</p>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
        width={520}
        className="premium-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRequestLeave}
          requiredMark={false}
          className="pt-4"
        >
          <Form.Item
            name="type"
            label={<span className="font-semibold text-slate-700">Leave Type</span>}
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select
              placeholder="Select leave type"
              size="large"
              options={[
                { value: 'Vacation', label: 'Vacation' },
                { value: 'Sick Leave', label: 'Sick Leave' },
                { value: 'Personal', label: 'Personal Leave' },
                { value: 'Maternity/Paternity', label: 'Maternity/Paternity' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="dates"
            label={<span className="font-semibold text-slate-700">Duration</span>}
            rules={[{ required: true, message: 'Please select dates' }]}
          >
            <RangePicker
              className="w-full h-[44px] rounded-lg"
              suffixIcon={<CalendarOutlined className="text-slate-400" />}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label={<span className="font-semibold text-slate-700">Reason</span>}
          >
            <TextArea
              rows={4}
              placeholder="Tell us why you need this leave..."
              className="rounded-lg border-slate-200"
            />
          </Form.Item>

          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-slate-50">
            <Button
              onClick={() => setIsModalVisible(false)}
              className="h-[42px] px-6 rounded-lg border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="!bg-[#7c3aed] h-[42px] px-8 rounded-lg font-semibold"
            >
              Submit Request
            </Button>
          </div>
        </Form>
      </Modal>

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f9fafb !important;
          color: #64748b !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
          padding: 16px 24px !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
        }
        .premium-modal .ant-modal-content {
          border-radius: 20px !important;
          padding: 24px !important;
        }
        .premium-modal .ant-select-selector, .premium-modal .ant-picker {
          border-radius: 10px !important;
          border-color: #e2e8f0 !important;
        }
      `}</style>
    </div>
  )
}
