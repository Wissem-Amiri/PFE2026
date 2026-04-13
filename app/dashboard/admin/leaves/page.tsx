'use client'
import { useEffect, useState } from 'react'
import { getAllLeavesDetailed, updateLeaveStatus } from '@/lib/congeService'
import type { Conge } from '@/lib/database.types'
import { message, Modal, Tag, Tooltip } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons'

export default function LeavesPage() {
  const [search, setSearch] = useState('')
  const [leaves, setLeaves] = useState<(Conge & { user: any })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaves = async () => {
    setLoading(true)
    const { data } = await getAllLeavesDetailed()
    setLeaves(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const handleStatusUpdate = async (leave: Conge & { user: any }, status: 'approved' | 'rejected') => {
    Modal.confirm({
      title: `${status === 'approved' ? 'Approve' : 'Reject'} Leave Request?`,
      content: `Are you sure you want to ${status} the leave request for ${leave.user?.user_name}?`,
      okText: 'Yes',
      okType: status === 'approved' ? 'primary' : 'danger',
      cancelText: 'No',
      centered: true,
      onOk: async () => {
        const { error } = await updateLeaveStatus(leave.id, status)
        if (error) {
          message.error(`Failed to ${status} leave request`)
        } else {
          message.success(`Leave request ${status} successfully`)
          fetchLeaves()
        }
      }
    })
  }

  const filteredLeaves = leaves.filter(l => 
    (l.user?.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.type ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-[20px]">
        <div>
          <h1 className="text-[22px] font-bold text-[#101828] mb-0">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-1">Review and manage employee leave requests.</p>
        </div>
      </div>

      <div className="bg-white border border-[#E4E7EC] rounded-[16px] overflow-hidden shadow-sm">
        <div className="px-[20px] py-[16px] border-b border-[#E4E7EC] flex justify-between items-center bg-white">
          <div>
            <h3 className="text-[14px] font-bold text-[#101828] mb-0 mt-0">Latest Leaves Request</h3>
          </div>
          <div className="flex items-center gap-[8px] px-[12px] py-[8px] border border-[#D0D5DD] rounded-[8px] text-[13px] text-[#475467] bg-white focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-400 transition-all w-[300px]">
            <SearchOutlined className="text-slate-400" />
            <input 
              placeholder="Search employee or type..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-none outline-none font-medium text-[13px] text-[#101828] bg-transparent w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Employee</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Leave Type</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Duration</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Status</th>
                <th className="px-[20px] py-[12px] text-right text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-[20px] py-[14px] border-b border-[#F2F4F7] align-middle">
                    <div className="flex items-center gap-[12px]">
                      <div className="w-[36px] h-[36px] rounded-full overflow-hidden bg-[#EDE9FE] flex items-center justify-center text-[12px] font-bold text-[#7C3AED] shrink-0 border border-purple-100">
                        {l.user?.user_name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#101828]">{l.user?.user_name || 'Unknown User'}</div>
                        <div className="text-[11px] text-[#667085]">{l.user?.department || 'Staff'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-[20px] py-[14px] border-b border-[#F2F4F7] align-middle">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-[#101828]">{l.type}</span>
                      {l.reason && (
                        <Tooltip title={l.reason}>
                          <span className="text-[11px] text-[#667085] line-clamp-1 max-w-[200px] cursor-help">
                            <InfoCircleOutlined className="mr-1" /> {l.reason}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-[20px] py-[14px] text-[13px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                    <div className="font-medium">
                      {new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(l.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-[20px] py-[14px] border-b border-[#F2F4F7] align-middle">
                    {l.status === 'pending' && <Tag color="gold" className="rounded-full px-3 font-bold uppercase text-[10px]">Pending</Tag>}
                    {l.status === 'approved' && <Tag color="green" className="rounded-full px-3 font-bold uppercase text-[10px]">Approved</Tag>}
                    {l.status === 'rejected' && <Tag color="red" className="rounded-full px-3 font-bold uppercase text-[10px]">Rejected</Tag>}
                  </td>
                  <td className="px-[20px] py-[14px] border-b border-[#F2F4F7] align-middle text-right">
                    {l.status === 'pending' && (
                      <div className="flex gap-[8px] justify-end">
                        <Tooltip title="Approve Leave">
                          <button 
                            onClick={() => handleStatusUpdate(l, 'approved')}
                            className="w-[32px] h-[32px] rounded-[8px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[#16A34A] hover:bg-[#DCFCE7] hover:border-[#16A34A] transition-all"
                          >
                            ✓
                          </button>
                        </Tooltip>
                        <Tooltip title="Reject Leave">
                          <button 
                            onClick={() => handleStatusUpdate(l, 'rejected')}
                            className="w-[32px] h-[32px] rounded-[8px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[#D92D20] hover:bg-[#FEF2F2] hover:border-[#D92D20] transition-all"
                          >
                            ✕
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

