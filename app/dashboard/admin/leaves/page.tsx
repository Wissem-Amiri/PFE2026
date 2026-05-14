'use client'
import { useState, useEffect } from 'react'
import { updateLeaveStatus, getDepartmentAvailability } from '@/app/api/leaves'
import {
  message,
  Modal,
  Tooltip,
  Input,
  Select,
  DatePicker
} from 'antd'
import dayjs from 'dayjs'
import {
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineExclamation,
  HiOutlineShieldCheck
} from 'react-icons/hi'
import { useLeaves, queryKeys } from '@/lib/hooks'

import { useQueryClient } from '@tanstack/react-query'



export default function AdminLeavesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All Types')
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const pageSize = 8

  const { data: result, isLoading: loading } = useLeaves({
    page: currentPage,
    pageSize,
    status: statusFilter,
    leaveType: leaveTypeFilter,
    search: search,
    startDate: dateRange?.[0]?.toISOString(),
    endDate: dateRange?.[1]?.toISOString()
  })

  const leaves = result?.data || []
  const totalItems = result?.count || 0
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [actionModal, setActionModal] = useState<{ open: boolean, type: 'approved' | 'rejected', leave: any }>({ open: false, type: 'approved', leave: null })
  const [rejectionReason, setRejectionReason] = useState('')
  const [deptAvailability, setDeptAvailability] = useState<any>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  const [messageApi, contextHolder] = message.useMessage()
  const filteredLeaves = leaves.filter(l => {
    return (l.user?.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.type || '').toLowerCase().includes(search.toLowerCase())
  })
  const paginatedData = filteredLeaves

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedData.map(l => l.id)))
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

  const handleAction = async (leave: any, status: 'approved' | 'rejected') => {
    setActionModal({ open: true, type: status, leave })
    setRejectionReason('')
    setDeptAvailability(null)
    setLoadingAvailability(true)
    try {
      const availability = await getDepartmentAvailability(leave.employee_id, leave.start_date, leave.end_date)
      setDeptAvailability(availability)
    } catch (e) {
      console.error('Failed to load dept availability', e)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const confirmAction = async () => {
    const { leave, type } = actionModal
    if (!leave) return

    if (type === 'rejected' && !rejectionReason.trim()) {
      messageApi.error("Veuillez indiquer un motif de refus.")
      return
    }

    const { error } = await updateLeaveStatus(leave.id, type, type === 'rejected' ? rejectionReason : undefined)
    if (error) {
      messageApi.error(`Failed to ${type} leave request`)
    } else {
      messageApi.success(`Leave request ${type} successfully`)
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves() })
    }
    setActionModal({ open: false, type: 'approved', leave: null })
  }



  const showDetails = (record: any) => {
    Modal.info({
      title: null,
      icon: null,
      content: (
        <div className="pt-2 font-['Inter']">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F9FAFB] border border-[#EAECF0]">
              {record.user?.avatar_url ? (
                <img src={record.user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-[#7c3aed] font-bold bg-[#f5f3ff] text-xl uppercase">
                  {record.user?.user_name?.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-[#101828] leading-tight">{record.user?.user_name}</h3>
              <p className="text-[#667085] text-[14px] font-medium">{record.user?.position || 'Employee'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-widest block mb-2">Reason</label>
              <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#EAECF0] text-[#344054] leading-relaxed italic text-[15px]">
                "{record.reason || "No reason provided."}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-widest block mb-1">Type</label>
                <p className="text-[16px] font-semibold text-[#101828]">{record.type}</p>
              </div>
              <div>
                <label className="text-[12px] font-bold text-[#98A2B3] uppercase tracking-widest block mb-1">Status</label>
                <div className="inline-block">
                  {record.status === 'pending' && <span className="px-[10px] py-[2px] rounded-full bg-[#FFFAEB] text-[#B54708] text-[12px] font-bold border border-[#FEDF89] capitalize">Pending</span>}
                  {record.status === 'approved' && <span className="px-[10px] py-[2px] rounded-full bg-[#ECFDF5] text-[#027A48] text-[12px] font-bold border border-[#A1F7D5] capitalize">Approved</span>}
                  {record.status === 'rejected' && <span className="px-[10px] py-[2px] rounded-full bg-[#FEF2F2] text-[#B42318] text-[12px] font-bold border border-[#FEE4E2] capitalize">Rejected</span>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f5f3ff] rounded-xl border border-[#ddd6fe] flex items-center justify-between">
              <div>
                <label className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest block mb-1">Date Range</label>
                <p className="text-[#5b21b6] font-bold">
                  {dayjs(record.start_date).format('DD MMM YYYY')} – {dayjs(record.end_date).format('DD MMM YYYY')}
                </p>
              </div>
              <div className="text-right">
                <label className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest block mb-1">Total</label>
                <p className="text-[#5b21b6] font-bold text-lg">{dayjs(record.end_date).diff(dayjs(record.start_date), 'day') + 1} Days</p>
              </div>
            </div>
          </div>
        </div>
      ),
      okText: 'Close',
      centered: true,
      width: 500,
      okButtonProps: {
        style: { backgroundColor: '#7F56D9', border: 'none', height: '44px', borderRadius: '8px', fontWeight: 'bold' },
        className: 'hover:!bg-[#6941C6] transition-all shadow-sm'
      }
    })
  }

  const totalPages = Math.ceil(totalItems / pageSize)

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, leaveTypeFilter, dateRange, search])

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb] font-['Inter',sans-serif]">
      {contextHolder}

      {/* Action Modal */}
      <Modal
        open={actionModal.open}
        onCancel={() => setActionModal({ ...actionModal, open: false })}
        footer={null}
        centered
        width="95%"
        style={{ maxWidth: 540 }}
        className="fidelity-modal"
      >
        <div className="flex flex-col items-center text-center pt-4">
          <div className={`w-[64px] h-[64px] rounded-[14px] flex items-center justify-center mb-6 ${actionModal.type === 'approved' ? 'bg-[#ecfdf5] border border-[#abefc6]' : 'bg-[#fef2f2] border border-[#fecaca]'}`}>
            {actionModal.type === 'approved' ? (
              <HiOutlineCheck className="text-[#10b981] text-[32px]" />
            ) : (
              <HiOutlineX className="text-[#dc2626] text-[32px]" />
            )}
          </div>
          <h3 className="text-[24px] font-bold text-[#101828] mb-3">
            {actionModal.type === 'approved' ? 'Approve' : 'Reject'} Request?
          </h3>
          <p className="text-[16px] text-[#667085] leading-relaxed mb-1 max-w-[440px]">
            Are you sure you want to {actionModal.type} the leave request for <span className="font-bold text-[#101828]">{actionModal.leave?.user?.user_name}</span>?
          </p>
          {/* ── Department Availability Context Panel ── */}
          {loadingAvailability ? (
            <div className="w-full mt-4 p-4 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] text-center">
              <HiOutlineClock className="text-[#98A2B3] text-xl animate-spin inline-block" />
              <span className="text-[13px] text-[#667085] ml-2">Loading department info...</span>
            </div>
          ) : deptAvailability && (
            <div className="w-full mt-4 text-left space-y-3">

              {/* Alert if below threshold */}
              {deptAvailability.belowThreshold && (
                <div className="flex items-start gap-3 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl">
                  <HiOutlineExclamation className="text-[#D92D20] text-lg flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-[#B42318] mb-0">Staffing Alert</p>
                    <p className="text-[12px] text-[#D92D20] mb-0">Approving this request will bring <strong>{deptAvailability.department}</strong> below the minimum staffing level ({deptAvailability.minStaff} required).</p>
                  </div>
                </div>
              )}

              {!deptAvailability.belowThreshold && actionModal.type === 'approved' && (
                <div className="flex items-start gap-3 p-3 bg-[#ECFDF3] border border-[#ABEFC6] rounded-xl">
                  <HiOutlineShieldCheck className="text-[#12B76A] text-lg flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-[#027A48] mb-0">Safe to approve</p>
                    <p className="text-[12px] text-[#067647] mb-0">Department <strong>{deptAvailability.department}</strong> will remain above minimum staffing after approval.</p>
                  </div>
                </div>
              )}

              {/* Department Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#F9FAFB] rounded-xl p-3 text-center border border-[#EAECF0]">
                  <HiOutlineUserGroup className="text-[#7F56D9] text-lg mx-auto mb-1" />
                  <p className="text-[18px] font-extrabold text-[#101828] mb-0">{deptAvailability.totalInDept}</p>
                  <p className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider mb-0">In Dept</p>
                </div>
                <div className="bg-[#FEF3F2] rounded-xl p-3 text-center border border-[#FECDCA]">
                  <HiOutlineCalendar className="text-[#F04438] text-lg mx-auto mb-1" />
                  <p className="text-[18px] font-extrabold text-[#B42318] mb-0">{deptAvailability.absentCount}</p>
                  <p className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider mb-0">On Leave</p>
                </div>
                <div className={`rounded-xl p-3 text-center border ${deptAvailability.belowThreshold ? 'bg-[#FEF3F2] border-[#FECDCA]' : 'bg-[#ECFDF3] border-[#ABEFC6]'}`}>
                  <HiOutlineCheck className={`text-lg mx-auto mb-1 ${deptAvailability.belowThreshold ? 'text-[#F04438]' : 'text-[#12B76A]'}`} />
                  <p className={`text-[18px] font-extrabold mb-0 ${deptAvailability.belowThreshold ? 'text-[#B42318]' : 'text-[#027A48]'}`}>{deptAvailability.availableAfter}</p>
                  <p className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider mb-0">After Approval</p>
                </div>
              </div>

              {/* Employee balance */}
              <div className="flex items-center justify-between bg-[#F5F3FF] rounded-xl p-3 border border-[#DDD6FE]">
                <span className="text-[12px] font-bold text-[#5B21B6] uppercase tracking-wider">Leave Balance</span>
                <span className="text-[16px] font-extrabold text-[#7C3AED]">{deptAvailability.balance} days remaining</span>
              </div>

              {/* Recent leaves history */}
              {deptAvailability.recentLeaves.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-[#98A2B3] uppercase tracking-widest mb-2">Recent History</p>
                  <div className="space-y-1">
                    {deptAvailability.recentLeaves.map((l: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border border-[#F2F4F7] text-[12px]">
                        <span className="font-semibold text-[#344054]">{l.type}</span>
                        <span className="text-[#667085]">{dayjs(l.start_date).format('DD MMM')} – {dayjs(l.end_date).format('DD MMM YY')}</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${l.status === 'approved' ? 'bg-[#ECFDF3] text-[#027A48]' : l.status === 'rejected' ? 'bg-[#FEF2F2] text-[#B42318]' : 'bg-[#FFFAEB] text-[#B54708]'}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {actionModal.type === 'approved' && (
            <p className="text-[14px] text-[#027a48] font-medium bg-[#ecfdf5] px-3 py-1 rounded-full mt-3">
              Balance will be deducted immediately
            </p>
          )}

          {actionModal.type === 'rejected' && (
            <div className="w-full mt-4 text-left">
              <label className="text-[14px] font-semibold text-[#344054] mb-2 block">Motif de refus <span className="text-red-500">*</span></label>
              <Input.TextArea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez brièvement pourquoi cette demande est refusée..."
                rows={3}
                className="rounded-[10px] text-[15px]"
              />
            </div>
          )}

          <div className="flex gap-4 w-full mt-8">
            <button
              onClick={() => setActionModal({ ...actionModal, open: false })}
              className="flex-1 h-[48px] border border-[#d0d5dd] rounded-[10px] font-bold text-[#344054] hover:bg-gray-50 transition-all bg-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className={`flex-1 h-[48px] text-white rounded-[10px] font-bold transition-all shadow-md ${actionModal.type === 'approved' ? 'bg-[#7f56d9] hover:bg-[#6941c6] shadow-[#7f56d9]/20' : 'bg-[#d11010] hover:bg-[#b91c1c] shadow-red-100'}`}
            >
              Confirm {actionModal.type === 'approved' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-[#eaecf0] pt-6 md:pt-[40px] pb-[32px] px-4 md:px-[40px]">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-[30px] font-semibold text-[#101828] tracking-tight">Leaves</h1>
            <p className="text-[16px] text-[#667085] font-normal">Keep track of yours and your team's medical and personal leaves.</p>
          </div>
          <div className="flex gap-3">
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 p-4 md:p-[40px] pt-4 md:pt-0">
        <div className="max-w-[1400px] mx-auto space-y-[24px]">

          {/* ── SEARCH & FILTERS BAR ── */}
          <div className="bg-[rgba(248,248,248,0.31)] border border-[rgba(203,195,213,0.1)] rounded-[16px] h-auto p-4 mb-[16px] flex flex-col xl:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full xl:max-w-[550px] relative">
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

            <div className="flex flex-col sm:flex-row gap-[16px] items-center w-full xl:w-auto">
              <div className="w-full sm:w-[180px]">
                <Select
                  value={statusFilter}
                  onChange={val => setStatusFilter(val)}
                  className="w-full !h-[44px] !rounded-[12px] font-['Inter']"
                  options={[
                    { value: 'All Status', label: 'Filter by Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                  style={{ borderRadius: '12px', border: '1px solid rgba(203,195,213,0.2)' }}
                />
              </div>

              <div className="w-full sm:w-[180px]">
                <Select
                  value={leaveTypeFilter}
                  onChange={val => setLeaveTypeFilter(val)}
                  className="w-full !h-[44px] !rounded-[12px] font-['Inter']"
                  options={[
                    { value: 'All Types', label: 'Filter by Type' },
                    { value: 'Personal', label: 'Personal' },
                    { value: 'Sick', label: 'Sick' },
                    { value: 'Casual', label: 'Casual' },
                    { value: 'Maternity', label: 'Maternity' },
                    { value: 'Paternity', label: 'Paternity' },
                  ]}
                  style={{ borderRadius: '12px', border: '1px solid rgba(203,195,213,0.2)' }}
                />
              </div>

              <div className="w-full sm:w-[280px]">
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as any)}
                  className="w-full !rounded-[12px] !py-[11px] !border-[rgba(203,195,213,0.2)] hover:!border-[#7f56d9] focus:!border-[#7f56d9] !shadow-none font-['Inter']"
                  placeholder={['Start Date', 'End Date']}
                  format="DD/MM/YYYY"
                />
              </div>
            </div>
          </div>

          {/* ── SELECTION BAR ── */}
          {selectedIds.size > 0 && (
            <div className="mx-[16px] mb-[16px] p-[12px] bg-[#FFFBFA] border border-[#FDA29B] rounded-[12px] flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-[12px]">
                <span className="text-[14px] font-semibold text-[#B42318]">{selectedIds.size} request(s) selected</span>
                <button
                  onClick={toggleSelectAll}
                  className="text-[14px] font-semibold text-[#7F56D9] bg-transparent border-0 cursor-pointer hover:underline"
                >
                  {selectedIds.size === paginatedData.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-[12px] border border-[#eaecf0] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] overflow-hidden w-full overflow-x-auto no-scrollbar">
            <div className="min-w-[1000px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#eaecf0]">
                    <th className="px-[24px] py-[12px] w-[64px]">
                      <input
                        type="checkbox"
                        checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                        onChange={toggleSelectAll}
                        className="w-[16px] h-[16px] rounded-[4px] border-[#cbd5e1] checked:accent-[#7f56d9] cursor-pointer"
                      />
                    </th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Employee</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Leave Type</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Duration</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Dates</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px]">Status</th>
                    <th className="px-[24px] py-[12px] text-[12px] font-medium text-[#667085] uppercase tracking-[0.6px] text-center pr-[60px]">Actions</th>
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
                          <div className="flex justify-start items-center">
                            <div className="grid grid-cols-[32px_32px_32px] gap-[4px] items-center">
                              {leave.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleAction(leave, 'approved')}
                                    className="w-[32px] h-[32px] rounded-[6px] text-emerald-600 hover:bg-emerald-50 transition-all font-bold flex items-center justify-center"
                                    title="Approve"
                                  >
                                    <HiOutlineCheck size={20} />
                                  </button>
                                  <button
                                    onClick={() => showDetails(leave)}
                                    className="w-[32px] h-[32px] rounded-[6px] text-[#7f56d9] hover:bg-[#f9f5ff] transition-all flex items-center justify-center"
                                    title="View Details"
                                  >
                                    <HiOutlineEye size={20} />
                                  </button>
                                  <button
                                    onClick={() => handleAction(leave, 'rejected')}
                                    className="w-[32px] h-[32px] rounded-[6px] text-rose-600 hover:bg-rose-50 transition-all font-bold flex items-center justify-center"
                                    title="Reject"
                                  >
                                    <HiOutlineX size={20} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="w-[32px]" />
                                  <button
                                    onClick={() => showDetails(leave)}
                                    className="w-[32px] h-[32px] rounded-[6px] text-[#7f56d9] hover:bg-[#f9f5ff] transition-all flex items-center justify-center"
                                    title="View Details"
                                  >
                                    <HiOutlineEye size={20} />
                                  </button>
                                  <div className="w-[32px]" />
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── PAGINATION ── */}
          {totalItems > pageSize && (
            <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-[#eaecf0] rounded-[12px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] mt-4">
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

