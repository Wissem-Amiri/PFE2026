'use client'
import { useEffect, useState } from 'react'
import { getAllLeavesDetailed, updateLeaveStatus } from '@/api/conge'
import type { Conge } from '@/api/database.types'
import { 
  message, 
  Modal, 
  Table, 
  Tooltip } from 'antd'
  import { SettingOutlined } from '@ant-design/icons'
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

  const fetchSettings = async () => {
    // Supprimé car les paramètres globaux ne sont plus utilisés
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const handleAction = async (leave: any, status: 'approved' | 'rejected') => {
    Modal.confirm({
      title: (
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'approved' ? 'bg-green-50' : 'bg-red-50'}`}>
            <img 
              src={status === 'approved' ? "/assets/check-mark.svg" : "/assets/cross.svg"} 
              alt="" 
              className="w-6 h-6"
            />
          </div>
          <div>
            <h4 className="text-[18px] font-semibold text-[#101828] mb-0">{status === 'approved' ? 'Approve' : 'Reject'} Request?</h4>
          </div>
        </div>
      ),
      content: (
        <div className="pt-3 text-[14px] text-[#667085] leading-relaxed">
          Are you sure you want to {status} the leave request for <b className="text-[#101828] font-medium">{leave.user?.user_name}</b>?
          {status === 'approved' && " The employee's balance will be deducted immediately."}
        </div>
      ),
      okText: status === 'approved' ? 'Approve' : 'Reject',
      cancelText: 'Cancel',
      okButtonProps: { 
        className: status === 'approved' ? 'bg-[#7F56D9] hover:bg-[#6941C6] border-none h-[44px] px-4 rounded-[8px] text-[14px] font-semibold' : 'bg-red-600 hover:bg-red-700 border-none h-[44px] px-4 rounded-[8px] text-[14px] font-semibold',
      },
      cancelButtonProps: {
        className: 'h-[44px] px-4 rounded-[8px] text-[14px] font-semibold border-[#D0D5DD] text-[#344054]'
      },
      centered: true,
      width: 400,
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
    <div className="flex flex-col items-center justify-center py-[100px] px-4 text-center">
       <div className="w-[48px] h-[48px] bg-[#F9FAFB] border border-[#EAECF0] rounded-[10px] flex items-center justify-center mb-4 shadow-sm">
          <img src="/assets/sidebar-leaves.svg" alt="" className="w-6 h-6 opacity-40" />
       </div>
       <h3 className="text-[16px] font-semibold text-[#101828] mb-1">No leaves found</h3>
       <p className="text-[14px] text-[#667085] max-w-[280px]">Your search did not match any leave requests. Try adjusting your filters.</p>
    </div>
  )

  const columns = [
    {
      title: 'EMPLOYEE',
      key: 'user',
      width: '30%',
      render: (record: any) => (
        <div className="flex items-center gap-[12px]">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#F9FAFB] border border-[#EAECF0] flex-shrink-0">
            {record.user?.avatar_url ? (
              <img src={record.user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[14px] font-medium text-[#475467] bg-[#F4EBFF]">
                {record.user?.user_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-medium text-[#101828] truncate">{record.user?.user_name || 'Unknown'}</span>
            <span className="text-[14px] text-[#667085] truncate font-normal">{record.user?.position || 'Employee'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'LEAVE TYPE',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let icon = "/assets/vacation.svg";
        let color = '#027A48';
        let bgColor = '#ECFDF3';
        
        if (type === 'Sick') { color = '#B42318'; bgColor = '#FEF3F2'; }
        if (type === 'Casual') { color = '#B54708'; bgColor = '#FFFAEB'; }
        if (type === 'Personal') { color = '#344054'; bgColor = '#F9FAFB'; }
        
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mix-blend-multiply`} style={{ backgroundColor: bgColor }}>
            <img src={icon} alt="" className="w-3.5 h-3.5" style={{ filter: type === 'Vacation' ? 'none' : 'grayscale(1) brightness(0.5)' }} />
            <span className="text-[12px] font-medium" style={{ color }}>{type}</span>
          </div>
        )
      }
    },
    {
      title: 'DURATION',
      key: 'duration',
      render: (record: any) => {
        const diff = dayjs(record.end_date).diff(dayjs(record.start_date), 'day') + 1;
        return (
          <span className="text-[14px] text-[#667085] font-normal">{diff} days</span>
        )
      }
    },
    {
      title: 'DATES',
      key: 'dates',
      render: (record: any) => (
        <div className="flex flex-col">
          <span className="text-[14px] text-[#101828] font-medium">
            {dayjs(record.start_date).format('DD/MM/YYYY')}
          </span>
          <span className="text-[12px] text-[#667085] font-normal">
            to {dayjs(record.end_date).format('DD/MM/YYYY')}
          </span>
        </div>
      )
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let bgColor = '#FFFAEB';
        let textColor = '#B54708';
        if (status === 'approved') { bgColor = '#ECFDF3'; textColor = '#027A48'; }
        if (status === 'rejected') { bgColor = '#FEF3F2'; textColor = '#B42318'; }
        
        return (
          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium capitalize" style={{ backgroundColor: bgColor, color: textColor }}>
            {status}
          </div>
        )
      }
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right' as const,
      render: (record: any) => (
        <div className="flex justify-end gap-1 px-1">
          <Tooltip title="View Details">
            <button 
              className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                Modal.info({
                  title: 'Leave Request Details',
                  content: (
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-[12px] font-medium text-[#667085] uppercase tracking-wider">Reason</label>
                        <p className="mt-1 text-[14px] text-[#101828] leading-relaxed bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0]">
                          {record.reason || "No reason provided."}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[12px] font-medium text-[#667085] uppercase tracking-wider">Type</label>
                          <p className="mt-1 font-semibold text-[#101828]">{record.type}</p>
                        </div>
                        <div>
                          <label className="text-[12px] font-medium text-[#667085] uppercase tracking-wider">Status</label>
                          <p className="mt-1 font-semibold capitalize text-[#7F56D9]">{record.status}</p>
                        </div>
                      </div>
                    </div>
                  ),
                  centered: true,
                  width: 500,
                  okButtonProps: { className: 'bg-[#7F56D9] hover:bg-[#6941C6] border-none rounded-lg' }
                })
              }}
            >
              <img src="/assets/eye.svg" alt="" className="w-5 h-5 opacity-70" />
            </button>
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <button 
                  onClick={() => handleAction(record, 'approved')}
                  className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <img src="/assets/check-mark.svg" alt="" className="w-5 h-5 text-green-600" />
                </button>
              </Tooltip>
              <Tooltip title="Reject">
                <button 
                  onClick={() => handleAction(record, 'rejected')}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <img src="/assets/cross.svg" alt="" className="w-5 h-5 text-red-600" />
                </button>
              </Tooltip>
            </>
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
    <div className="flex-1 p-[32px] px-[40px] h-full overflow-y-auto bg-white font-['Inter',sans-serif]">
      {contextHolder}
      
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-[24px] mb-[32px]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
             <h1 className="text-[24px] sm:text-[30px] font-semibold text-[#101828] tracking-tight">Latest Leaves Request</h1>
             <p className="text-[14px] sm:text-[16px] text-[#667085] font-normal">Keep track of yours and your team's medical and personal leaves.</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
             <div className="relative">
                <img src="/assets/search.svg" alt="" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                <input 
                  placeholder="Search requests..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-[#D0D5DD] rounded-[8px] text-[14px] w-[320px] shadow-sm focus:ring-2 focus:ring-[#F4EBFF] focus:border-[#D6BBFB] outline-none transition-all placeholder:text-[#667085]"
                />
             </div>
          </div>
        </div>
      </div>

      {/* ── TABLE CONTAINER ── */}
      <div className="bg-white rounded-[12px] border border-[#EAECF0] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EAECF0] flex justify-between items-center">
           <h3 className="text-[18px] font-semibold text-[#101828]">Leaves Requests</h3>
           <div className="flex gap-3">
             <button className="px-4 py-2 text-[14px] font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-[8px] shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
               <img src="/assets/export.svg" alt="" className="w-4 h-4" />
               Export
             </button>
           </div>
        </div>
        
        <Table
          columns={columns} 
          dataSource={filteredLeaves} 
          pagination={{ 
            pageSize: 8, 
            hideOnSinglePage: false,
            className: 'custom-pagination px-6 py-4 border-t border-[#EAECF0] m-0'
          }}
          loading={loading}
          className="modern-table"
          rowKey="id"
          locale={{ emptyText: <CustomEmpty /> }}
        />
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .modern-table .ant-table-thead > tr > th {
          background: #F9FAFB !important;
          color: #667085 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          padding: 12px 24px !important;
          border-bottom: 1px solid #EAECF0 !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid #EAECF0 !important;
          height: 72px;
        }
        .modern-table .ant-table-row:hover > td {
          background-color: #F9FAFB !important;
        }
        .modern-table .ant-table {
          background: transparent !important;
        }
        .ant-modal-content {
          border-radius: 12px !important;
          box-shadow: 0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03) !important;
          padding: 24px !important;
        }
        .custom-pagination .ant-pagination-prev, .custom-pagination .ant-pagination-next {
          border: 1px solid #D0D5DD !important;
          border-radius: 8px !important;
          min-width: 36px !important;
          height: 36px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .custom-pagination .ant-pagination-item {
          border: 1px solid #D0D5DD !important;
          border-radius: 8px !important;
          min-width: 36px !important;
          height: 36px !important;
          line-height: 34px !important;
        }
        .custom-pagination .ant-pagination-item-active {
          background: #F9F5FF !important;
          border-color: #D6BBFB !important;
        }
        .custom-pagination .ant-pagination-item-active a {
          color: #7F56D9 !important;
        }
      `}</style>
    </div>
  )
}
