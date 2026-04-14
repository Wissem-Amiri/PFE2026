'use client'
import { useEffect, useState } from 'react'
import { getAllLeavesDetailed, updateLeaveStatus } from '@/lib/congeService'
import type { Conge } from '@/lib/database.types'
import { 
  message, 
  Modal, 
  Tag, 
  Tooltip, 
  Avatar, 
  Table 
} from 'antd'
import { 
  CheckOutlined, 
  CloseOutlined, 
  SearchOutlined,
  EllipsisOutlined,
  LockFilled,
  MedicineBoxFilled,
  AlertFilled,
  SunFilled,
  CalendarOutlined,
  UserOutlined,
  InboxOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

export default function AdminLeavesPage() {
  const [search, setSearch] = useState('')
  const [leaves, setLeaves] = useState<(Conge & { user: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [messageApi, contextHolder] = message.useMessage()

  const fetchLeaves = async () => {
    setLoading(true)
    const { data } = await getAllLeavesDetailed()
    setLeaves(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const handleAction = async (leave: any, status: 'approved' | 'rejected') => {
    Modal.confirm({
      title: (
        <div className="flex items-center gap-2">
          {status === 'approved' ? <CheckOutlined className="text-green-500" /> : <CloseOutlined className="text-red-500" />}
          <span className="text-[16px] font-black">{status === 'approved' ? 'Approve' : 'Reject'} Request?</span>
        </div>
      ),
      content: (
        <div className="pt-2 text-[13px] text-[#667085]">
          Are you sure you want to {status} the leave request for <b className="text-[#101828]">{leave.user?.user_name}</b>?
          {status === 'approved' && " The employee's balance will be deducted immediately."}
        </div>
      ),
      okText: 'Confirm',
      cancelText: 'Cancel',
      okButtonProps: { 
        className: status === 'approved' ? 'bg-[#7C3AED] hover:bg-[#6D28D9]' : 'bg-red-500 hover:bg-red-600',
        style: { borderRadius: '8px', fontWeight: 'bold' } 
      },
      centered: true,
      onOk: async () => {
        const { error } = await updateLeaveStatus(leave.id, status)
        if (error) {
          messageApi.error(`Failed to ${status} leave request`)
        } else {
          messageApi.success(`Leave request ${status} successfully`)
          fetchLeaves()
        }
      }
    })
  }

  const CustomEmpty = () => (
    <div className="flex flex-col items-center justify-center py-[80px]">
       <div className="w-[64px] h-[64px] bg-[#f9fafb] border border-[#f2f4f7] rounded-[18px] flex items-center justify-center mb-4 shadow-sm">
          <InboxOutlined className="text-[#d0d5dd] text-[28px]" />
       </div>
       <span className="text-[14px] text-[#667085] font-medium">No results found</span>
    </div>
  )

  const stats = [
    { 
      title: 'Pending Requests', 
      count: leaves.filter(l => l.status === 'pending').length.toString().padStart(2, '0'), 
      icon: <CalendarOutlined />, 
      color: '#FEF9C3', 
      iconColor: '#A16207' 
    },
    { 
      title: 'Approved', 
      count: leaves.filter(l => l.status === 'approved').length.toString().padStart(2, '0'), 
      icon: <CheckOutlined />, 
      color: '#DCFCE7', 
      iconColor: '#16A34A' 
    },
    { 
      title: 'Rejected', 
      count: leaves.filter(l => l.status === 'rejected').length.toString().padStart(2, '0'), 
      icon: <CloseOutlined />, 
      color: '#FEE2E2', 
      iconColor: '#DC2626' 
    },
    { 
      title: 'Total Requests', 
      count: leaves.length.toString().padStart(2, '0'), 
      icon: <UserOutlined />, 
      color: '#F5F3FF', 
      iconColor: '#7C3AED' 
    },
  ]

  const columns = [
    {
      title: 'EMPLOYEE',
      key: 'user',
      render: (record: any) => (
        <div className="flex items-center gap-[12px]">
          <Avatar 
            size={40} 
            src={record.user?.avatar_url} 
            icon={<UserOutlined />} 
            className="border-2 border-white shadow-sm ring-1 ring-slate-100"
          />
          <div>
            <div className="text-[14px] font-bold text-[#101828] leading-tight">{record.user?.user_name || 'Unknown'}</div>
            <div className="text-[12px] text-[#667085] font-medium mt-0.5">{record.user?.position || 'Employee'}</div>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1">
          START - END <ArrowDownOutlined className="text-[10px]" />
        </div>
      ),
      key: 'duration',
      render: (record: any) => (
        <div className="flex flex-col">
          <span className="text-[13px] text-[#475467] font-bold">
            {dayjs(record.start_date).format('MMM D, YYYY')}
          </span>
          <span className="text-[11px] text-[#667085] font-medium">
            to {dayjs(record.end_date).format('MMM D, YYYY')}
          </span>
        </div>
      )
    },
    {
      title: 'LEAVE TYPE',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let icon = <SunFilled />;
        let color = '#F97316';
        let bgColor = '#FFF4ED';
        if (type === 'Casual') { icon = <AlertFilled />; color = '#7C3AED'; bgColor = '#F5F3FF'; }
        if (type === 'Personal') { icon = <LockFilled />; color = '#3B82F6'; bgColor = '#EFF6FF'; }
        if (type === 'Sick') { icon = <MedicineBoxFilled />; color = '#EF4444'; bgColor = '#FEF2F2'; }
        return (
          <div className="flex items-center gap-2.5">
            <div 
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px]"
              style={{ backgroundColor: bgColor, color: color }}
            >
              {icon}
            </div>
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
          <Tag color={color} className="rounded-full px-3 py-0 pb-0.5 font-black uppercase text-[9px] border-none shadow-sm capitalize">
            {status}
          </Tag>
        )
      }
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right' as const,
      render: (record: any) => (
        <div className="flex justify-end gap-2">
          {record.status === 'pending' ? (
            <>
              <Tooltip title="Approve">
                <button 
                  onClick={() => handleAction(record, 'approved')}
                  className="w-[36px] h-[36px] rounded-[10px] border border-[#d0d5dd] bg-white text-[#16a34a] hover:bg-[#dcfce7] hover:border-[#16a34a] flex items-center justify-center cursor-pointer transition-all shadow-sm"
                >
                  <CheckOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Reject">
                <button 
                  onClick={() => handleAction(record, 'rejected')}
                  className="w-[36px] h-[36px] rounded-[10px] border border-[#d0d5dd] bg-white text-[#dc2626] hover:bg-[#fef2f2] hover:border-[#dc2626] flex items-center justify-center cursor-pointer transition-all shadow-sm"
                >
                  <CloseOutlined />
                </button>
              </Tooltip>
            </>
          ) : (
             <div className="w-[36px] h-[36px] flex items-center justify-center text-[#d0d5dd]">
                <EllipsisOutlined />
             </div>
          )}
        </div>
      )
    }
  ]

  const filteredLeaves = leaves.filter(l => 
    (l.user?.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.type || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 p-[32px] px-[40px] h-full overflow-y-auto bg-[#fcfcfd]">
      {contextHolder}
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-[32px]">
        <div>
           <h1 className="text-[26px] font-black text-[#101828] mb-0 tracking-tight leading-none text-left">Leave Management</h1>
           <p className="text-[14px] text-[#667085] font-medium mt-2 text-left">Manage and review employee time-off requests.</p>
        </div>
        
        <div className="flex items-center gap-[12px] px-[14px] py-[10px] border border-[#eaecf0] rounded-[12px] bg-white shadow-sm w-[360px] focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <SearchOutlined className="text-[#667085]" />
          <input 
            placeholder="Search by employee or leave type..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-[14px] font-medium w-full text-[#101828] placeholder:text-[#98a2b3]"
          />
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px] mb-[32px]">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-[24px] rounded-[20px] border border-[#eaecf0] shadow-sm group hover:border-[#7c3aed] transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-black text-[#667085] uppercase tracking-[0.1em]">{stat.title}</span>
              <EllipsisOutlined className="text-[#d0d5dd]" />
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
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-[20px] border border-[#eaecf0] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#eaecf0] flex justify-between items-center">
           <h3 className="text-[17px] font-black text-[#101828] mb-0">Latest Leaves Requests</h3>
           <button className="text-[13px] font-bold text-[#7c3aed] hover:underline cursor-pointer bg-transparent border-none">View All</button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredLeaves} 
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          loading={loading}
          className="pixel-perfect-table"
          rowKey="id"
          locale={{ emptyText: <CustomEmpty /> }}
        />
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
        .ant-modal-content {
          border-radius: 20px !important;
          padding: 24px !important;
        }
      `}</style>
    </div>
  )
}
