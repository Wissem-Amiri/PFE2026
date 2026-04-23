'use client'
import { useState } from 'react'
import { updateLeaveStatus } from '@/api/conge'
import {
  message,
  Modal,
  Tooltip
} from 'antd'
import dayjs from 'dayjs'
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock
} from 'react-icons/hi'
import { useLeaves, queryKeys } from '@/api/hooks'
import { archiveLeaves, unarchiveLeaves } from '@/api/conge'
import { useQueryClient } from '@tanstack/react-query'
import { 
  HiOutlineArchive, 
  HiOutlineRefresh 
} from 'react-icons/hi'
import { downloadCSV } from '@/api/export'

export default function AdminLeavesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const { data: leaves = [], isLoading: loading } = useLeaves(showArchived)
  const [messageApi, contextHolder] = message.useMessage()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeaves.length && filteredLeaves.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLeaves.map(l => l.id)))
    }
  }

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    try {
      if (showArchived) {
        await unarchiveLeaves(ids)
        messageApi.success('Selected requests unarchived')
      } else {
        await archiveLeaves(ids)
        messageApi.success('Selected requests archived')
      }
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves })
    } catch (error: any) {
      messageApi.error(error.message || 'Error updating requests')
    }
  }

  const [statusFilter, setStatusFilter] = useState('All Status')
  const [dateFilter, setDateFilter] = useState('All Time')

  const handleAction = async (leave: any, status: 'approved' | 'rejected') => {
    Modal.confirm({
      title: null,
      icon: null,
      content: (
        <div className="flex flex-col items-center text-center pt-4">
          <div className={`w-[64px] h-[64px] rounded-[14px] flex items-center justify-center mb-6 ${status === 'approved' ? 'bg-[#ecfdf5] border border-[#abefc6]' : 'bg-[#fef2f2] border border-[#fecaca]'}`}>
            {status === 'approved' ? (
              <HiOutlineCheck className="text-[#10b981] text-[32px]" />
            ) : (
              <HiOutlineX className="text-[#dc2626] text-[32px]" />
            )}
          </div>
          <h3 className="text-[24px] font-bold text-[#101828] mb-3">
            {status === 'approved' ? 'Approve' : 'Reject'} Request?
          </h3>
          <p className="text-[16px] text-[#667085] leading-relaxed mb-1 max-w-[440px]">
            Are you sure you want to {status} the leave request for <span className="font-bold text-[#101828]">{leave.user?.user_name}</span>?
          </p>
          {status === 'approved' && (
            <p className="text-[14px] text-[#027a48] font-medium bg-[#ecfdf5] px-3 py-1 rounded-full mt-2">
              Balance will be deducted immediately
            </p>
          )}
          <div className="flex gap-4 w-full mt-8">
            <button className="flex-1 h-[48px] border border-[#d0d5dd] rounded-[10px] font-bold text-[#344054] hover:bg-gray-50 transition-all">Cancel</button>
            <button
              onClick={async () => {
                const { error } = await updateLeaveStatus(leave.id, status)
                if (error) {
                  messageApi.error(`Failed to ${status} leave request`)
                } else {
                  messageApi.success(`Leave request ${status} successfully`)
                  queryClient.invalidateQueries({ queryKey: queryKeys.leaves })
                }
                Modal.destroyAll()
              }}
              className={`flex-1 h-[48px] text-white rounded-[10px] font-bold transition-all shadow-md ${status === 'approved' ? 'bg-[#7f56d9] hover:bg-[#6941c6] shadow-[#7f56d9]/20' : 'bg-[#d11010] hover:bg-[#b91c1c] shadow-red-100'}`}
            >
              Confirm {status === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      ),
      footer: null,
      centered: true,
      width: 540,
      className: 'fidelity-modal'
    })
  }

  const handleExport = () => {
    const headers = ['Employee', 'Email', 'Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Requested At']
    const rows = filteredLeaves.map(l => {
      const days = dayjs(l.end_date).diff(dayjs(l.start_date), 'day') + 1
      return [
        l.user?.user_name || 'Unknown',
        l.user?.email || '-',
        l.type || '-',
        dayjs(l.start_date).format('YYYY-MM-DD'),
        dayjs(l.end_date).format('YYYY-MM-DD'),
        days,
        l.reason || '-',
        l.status || '-',
        dayjs(l.created_at).format('YYYY-MM-DD HH:mm')
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    downloadCSV(csvContent, `leaves_export_${dayjs().format('YYYY-MM-DD')}.csv`)
  }

  const showDetails = (record: any) => {
    Modal.info({
      title: null,
      icon: null,
      content: (
        <div className="pt-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
              {record.user?.avatar_url ? (
                <img src={record.user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-blue-600 font-bold bg-blue-50 text-xl">
                  {record.user?.user_name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">{record.user?.user_name}</h3>
              <p className="text-gray-500 font-medium">{record.user?.position}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Reason</label>
              <div className="bg-[#f9fafb] p-4 rounded-xl border border-gray-100 text-gray-700 leading-relaxed italic">
                "{record.reason || "No reason provided."}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Type</label>
                <p className="text-[16px] font-bold text-gray-900">{record.type}</p>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
                <div className="inline-block">
                  {record.status === 'pending' && <span className="text-amber-600 font-bold capitalize">Pending Approval</span>}
                  {record.status === 'approved' && <span className="text-emerald-600 font-bold capitalize">Approved</span>}
                  {record.status === 'rejected' && <span className="text-rose-600 font-bold capitalize">Rejected</span>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <label className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Date Range</label>
                <p className="text-blue-900 font-bold">
                  {dayjs(record.start_date).format('DD MMM YYYY')} – {dayjs(record.end_date).format('DD MMM YYYY')}
                </p>
              </div>
              <div className="text-right">
                <label className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Total</label>
                <p className="text-blue-900 font-bold text-lg">{dayjs(record.end_date).diff(dayjs(record.start_date), 'day') + 1} Days</p>
              </div>
            </div>
          </div>
        </div>
      ),
      okText: 'Close',
      centered: true,
      width: 500,
      okButtonProps: {
        className: 'bg-gray-900 hover:bg-black border-none h-[44px] px-8 rounded-lg font-bold'
      }
    })
  }

  const filteredLeaves = leaves.filter(l => {
    const matchSearch =
      (l.user?.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.type || '').toLowerCase().includes(search.toLowerCase())

    const matchStatus =
      statusFilter === 'All Status' ||
      (statusFilter === 'Pending' && l.status === 'pending') ||
      (statusFilter === 'Approved' && l.status === 'approved') ||
      (statusFilter === 'Rejected' && l.status === 'rejected')

    const matchDate = dateFilter === 'All Time' || (() => {
      const appDate = new Date(l.created_at || '')
      const now = new Date()
      if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7))
        return appDate >= sevenDaysAgo
      }
      if (dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
        return appDate >= thirtyDaysAgo
      }
      return true
    })()

    return matchSearch && matchStatus && matchDate
  })

  const totalPages = Math.ceil(filteredLeaves.length / pageSize)
  const paginatedData = filteredLeaves.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb] font-['Inter',sans-serif]">
      {contextHolder}

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-[#eaecf0] pt-[40px] pb-[32px] px-[40px]">
        <div className="max-w-[1400px] mx-auto flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-[30px] font-semibold text-[#101828] tracking-tight">Latest Leaves Request</h1>
            <p className="text-[16px] text-[#667085] font-normal">Keep track of yours and your team's medical and personal leaves.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`h-[40px] px-[16px] flex items-center gap-[8px] border rounded-[8px] text-[14px] font-semibold shadow-sm transition-all
                ${showArchived ? 'bg-[#F9FAFB] text-[#7F56D9] border-[#D6BBFB]' : 'bg-white text-[#344054] border-[#d0d5dd] hover:bg-gray-50'}`}
            >
              <HiOutlineArchive className="text-[18px]" />
              {showArchived ? 'View Active' : 'Archive'}
            </button>
            <button 
              onClick={handleExport}
              className="h-[40px] px-[16px] flex items-center gap-[8px] bg-white border border-[#d0d5dd] rounded-[8px] text-[14px] font-semibold text-[#344054] hover:bg-gray-50 transition-all shadow-sm"
            >
              <HiOutlineDownload className="text-[18px]" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 p-[40px] pt-0">
        <div className="max-w-[1400px] mx-auto space-y-[24px]">

          {/* ── SEARCH & FILTERS BAR ── */}
          <div className="bg-[rgba(248,248,248,0.31)] border border-[rgba(203,195,213,0.1)] rounded-[16px] h-[76px] px-[16px] mb-[16px] flex items-center justify-between">
            <div className="flex-1 max-w-[550px] relative">
              <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[15px] h-[15px]">
                <img src="/assets/search.svg" alt="" className="w-full h-full opacity-60" />
              </div>
              <input
                placeholder="Search ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-[rgba(203,195,213,0.2)] rounded-[12px] pl-[41px] pr-[17px] py-[12px] text-[14px] text-[#101828] focus:outline-none focus:ring-1 focus:ring-[#7f56d9]/20 transition-all placeholder:text-[#6b7280]"
              />
            </div>

            <div className="flex gap-[16px] items-center">
              <div className="relative w-[160px]">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-[rgba(203,195,213,0.2)] rounded-[12px] px-[17px] py-[11px] text-[14px] font-medium text-[#494453] appearance-none focus:outline-none transition-all cursor-pointer"
                >
                  <option value="All Status">Filter by Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="relative w-[160px]">
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="w-full bg-white border border-[rgba(203,195,213,0.2)] rounded-[12px] px-[17px] py-[11px] text-[14px] font-medium text-[#494453] appearance-none focus:outline-none transition-all cursor-pointer"
                >
                  <option value="All Time">Filter by Date</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
                <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ── SELECTION BAR ── */}
          {selectedIds.size > 0 && (
            <div className="mx-[16px] mb-[16px] p-[12px] bg-[#FFFBFA] border border-[#FDA29B] rounded-[12px] flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-[12px]">
                <span className="text-[14px] font-semibold text-[#B42318]">{selectedIds.size} {showArchived ? 'archived' : 'request'} selected</span>
                <button 
                  onClick={toggleSelectAll}
                  className="text-[14px] font-semibold text-[#7F56D9] bg-transparent border-0 cursor-pointer hover:underline"
                >
                  {selectedIds.size === filteredLeaves.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <button 
                onClick={handleArchiveSelected}
                className="h-[40px] px-[16px] rounded-[8px] border border-[#FDA29B] bg-white text-[#B42318] font-semibold flex items-center gap-[8px] hover:bg-[#FFF1F0] hover:border-[#F97066] transition-all cursor-pointer shadow-sm"
              >
                {showArchived ? <HiOutlineRefresh className="text-[18px]" /> : <HiOutlineArchive className="text-[18px]" />}
                {showArchived ? 'Restore Selected' : 'Archive Selected'}
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-[12px] border border-[#eaecf0] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#eaecf0]">
                    <th className="px-[24px] py-[12px] w-[64px]">
                      <input
                        type="checkbox"
                        checked={filteredLeaves.length > 0 && selectedIds.size === filteredLeaves.length}
                        onChange={toggleSelectAll}
                        className="w-[16px] h-[16px] rounded-[4px] border-[#cbd5e1] checked:accent-[#7f56d9] cursor-pointer"
                      />
                    </th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Employee</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Leave Type</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Duration</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Dates</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Status</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-[100px] text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-[#f4ebff] border-t-[#7f56d9] rounded-full animate-spin" />
                          <span className="text-[#64748b] text-[14px]">Loading requests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-[100px] text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <HiOutlineCalendar className="text-3xl text-gray-300" />
                          </div>
                          <p className="text-[#64748b] text-[14px] max-w-[200px] mx-auto">No leave requests match your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((leave) => (
                      <tr key={leave.id} className="hover:bg-[#f9fafb] transition-all group">
                        <td className="px-[24px] py-[16px]">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(leave.id)}
                            onChange={() => toggleSelectRow(leave.id)}
                            className="w-[16px] h-[16px] rounded-[4px] border-[#cbd5e1] checked:accent-[#7f56d9] cursor-pointer"
                          />
                        </td>
                        <td className="px-[24px] py-[16px]">
                          <div className="flex items-center gap-[12px]">
                            <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-[#f4ebff] border border-[#eaecf0] shrink-0">
                              {leave.user?.avatar_url ? (
                                <img src={leave.user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-[#7f56d9]">
                                  {leave.user?.user_name?.charAt(0) || 'U'}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-semibold text-[#101828] truncate">{leave.user?.user_name || 'Unknown'}</span>
                              <span className="text-[12px] text-[#64748b] truncate leading-[16px]">{leave.user?.position || 'Employee'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-[24px] py-[16px]">
                          {(() => {
                            let config = { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
                            if (leave.type === 'Vacation') config = { color: '#F97316', bg: '#F9731611', border: '#F9731633' };
                            if (leave.type === 'Casual') config = { color: '#7C3AED', bg: '#7C3AED11', border: '#7C3AED33' };
                            if (leave.type === 'Personal') config = { color: '#3B82F6', bg: '#3B82F611', border: '#3B82F633' };
                            if (leave.type === 'Sick') config = { color: '#EF4444', bg: '#EF444411', border: '#EF444433' };

                            return (
                              <div 
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border"
                                style={{ color: config.color, backgroundColor: config.bg, borderColor: config.border }}
                              >
                                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: config.color }} />
                                {leave.type}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-[24px] py-[16px] text-[14px] text-[#475569]">
                          {dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1} Days
                        </td>
                        <td className="px-[24px] py-[16px]">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-medium text-[#101828]">{dayjs(leave.start_date).format('DD MMM YYYY')}</span>
                            <span className="text-[12px] text-[#64748b]">to {dayjs(leave.end_date).format('DD MMM YYYY')}</span>
                          </div>
                        </td>
                        <td className="px-[24px] py-[16px]">
                          {leave.status === 'pending' && <span className="px-[10px] py-[2px] rounded-full bg-[#fef3c7] text-[#b45309] text-[12px] font-medium">Pending</span>}
                          {leave.status === 'approved' && <span className="px-[10px] py-[2px] rounded-full bg-[#dcfce7] text-[#15803d] text-[12px] font-medium">Approved</span>}
                          {leave.status === 'rejected' && <span className="px-[10px] py-[2px] rounded-full bg-[#fee2e2] text-[#b91c1c] text-[12px] font-medium">Rejected</span>}
                        </td>
                        <td className="px-[24px] py-[16px]">
                          <div className="grid grid-cols-[32px_32px_32px] gap-[4px] justify-end">
                            <button
                              onClick={() => showDetails(leave)}
                              className="p-[6px] rounded-[6px] text-blue-600 hover:bg-blue-50 transition-all font-bold flex items-center justify-center"
                              title="View Details"
                            >
                              <HiOutlineEye size={20} />
                            </button>
                            {leave.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleAction(leave, 'approved')}
                                  className="p-[6px] rounded-[6px] text-emerald-600 hover:bg-emerald-50 transition-all font-bold flex items-center justify-center"
                                  title="Approve"
                                >
                                  <HiOutlineCheck size={20} />
                                </button>
                                <button
                                  onClick={() => handleAction(leave, 'rejected')}
                                  className="p-[6px] rounded-[6px] text-rose-600 hover:bg-rose-50 transition-all font-bold flex items-center justify-center"
                                  title="Reject"
                                >
                                  <HiOutlineX size={20} />
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="w-[32px]" />
                                <div className="w-[32px]" />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredLeaves.length > pageSize && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-[#f1f5f9] bg-white">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-3 py-2 border border-[#d0d5dd] rounded-[8px] text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <HiOutlineChevronLeft /> Previous
                </button>

                <div className="flex gap-[4px]">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-[40px] h-[40px] rounded-[8px] text-[14px] font-semibold transition-all ${currentPage === i + 1
                          ? 'bg-[#f9f5ff] text-[#7f56d9] ring-1 ring-[#7f56d9]'
                          : 'text-[#667085] hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-3 py-2 border border-[#d0d5dd] rounded-[8px] text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next <HiOutlineChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .fidelity-modal .ant-modal-content {
          border-radius: 20px !important;
          padding: 40px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        }

        .fidelity-modal .ant-modal-close {
          top: 24px;
          right: 24px;
        }
      `}</style>
    </div>
  )
}
