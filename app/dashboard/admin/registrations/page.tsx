'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Tag, message, Modal, DatePicker, Select, Input, Avatar } from 'antd'
import dayjs from 'dayjs'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  SolutionOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import {
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineLogout,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCalendar,
  HiOutlineTrash,
  HiOutlineDownload
} from 'react-icons/hi'
import { BiExport } from 'react-icons/bi'
import { exportTableToPDF } from '@/lib/export'
import { getAllUsers, updateUserStatus as updateGlobalUserStatus, exportToCSV, downloadCSV } from '@/api/profile'
import { getAllCandidaturesDetailed, updateCandidatureStatus, archiveCandidatures, restoreCandidatures, deleteAllOtherCandidatures, hardDeleteCandidatures } from '@/api/candidatures'
import { getAllJobs, decrementJobSeats } from '@/api/job'
import { HiOutlineArchive, HiOutlineRefresh } from 'react-icons/hi'
import type { FullProfile } from '@/api/database.types'

import { useCandidatures, queryKeys } from '@/api/hooks'
import { useQueryClient } from '@tanstack/react-query'

export default function RegistrationsPage() {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const pageSize = 10

  const { data: result, isLoading: loading } = useCandidatures({
    page: currentPage,
    pageSize,
    showArchived: false,
    status: statusFilter,
    startDate: dateRange?.[0]?.toISOString(),
    endDate: dateRange?.[1]?.toISOString(),
    search: search
  })

  const applications = result?.data || []
  const totalItems = result?.count || 0

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [appToApprove, setAppToApprove] = useState<any | null>(null)

  const [isHiringModal, setIsHiringModal] = useState(false)
  const [hiringData, setHiringData] = useState({
    hire_date: null,
    department: undefined,
    monthly_rate: undefined
  })

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [appToDelete, setAppToDelete] = useState<any | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const router = useRouter()

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    try {
      const { error } = await archiveCandidatures(ids)
      if (error) throw error
      message.success(`${ids.length} registration(s) archived successfully`)
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: queryKeys.candidatures })
    } catch (error: any) {
      message.error(error.message || 'Failed to archive registrations')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return

    Modal.confirm({
      title: 'Delete Registrations?',
      content: `Are you sure you want to permanently delete these ${selectedIds.size} registration(s)? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        const ids = Array.from(selectedIds)
        try {
          const { error } = await hardDeleteCandidatures(ids)
          if (error) throw error

          message.success(`${ids.length} registration(s) deleted permanently`)
          setSelectedIds(new Set())
          queryClient.invalidateQueries({ queryKey: queryKeys.candidatures })
        } catch (error: any) {
          message.error(error.message || 'Failed to delete registrations')
        }
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedData.map(u => u.id)))
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

  const handleAction = async (application: any, status: 'accepted' | 'rejected', hiringDetails?: any) => {
    const { error: appError } = await updateCandidatureStatus(application.id, status)

    if (!appError) {
      if (status === 'accepted') {
        const { error: statusError } = await updateGlobalUserStatus(application.candidat_id, 'approved', hiringDetails)

        if (!statusError) {
          await deleteAllOtherCandidatures(application.candidat_id, application.id)
          if (application.job_id) {
            await decrementJobSeats(application.job_id)
          }
        }
      }

      setIsModalVisible(false)
      setIsHiringModal(false)
      setIsDeleteModalVisible(false)
      message.success(`Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`)
      queryClient.invalidateQueries({ queryKey: queryKeys.candidatures })
    } else {
      message.error('Failed to update application status')
    }
  }

  const handleHiringDone = async () => {
    if (!appToApprove) return

    if (!hiringData.hire_date || !hiringData.department || !hiringData.monthly_rate) {
      message.warning('Please fill all hiring details')
      return
    }

    // @ts-expect-error dayjs formatting
    const hire_date = hiringData.hire_date.format('YYYY-MM-DD')

    await handleAction(appToApprove, 'accepted', {
      hire_date,
      department: hiringData.department,
      monthly_rate: hiringData.monthly_rate,
      position: appToApprove.job?.title || 'Employee'
    })
  }

  const handleExport = () => {
    if (applications.length === 0) {
      message.info('No registrations to export')
      return
    }

    const headers = ['Candidate', 'Email', 'Position', 'Submission Date', 'Status']
    const rows = applications.map(app => [
      app.candidat?.user?.user_name || 'Unknown',
      app.candidat?.user?.email || '—',
      app.job?.title || 'Candidate',
      dayjs(app.applied_at || app.created_at).format('MM/DD/YYYY'),
      app.status || '-'
    ])

    exportTableToPDF(
      'Registration Report',
      headers,
      rows,
      'Registrations_Report'
    )
    message.success('PDF Export successful')
  }

  // Server-side filtered data is directly available in 'applications'
  const paginatedData = applications

  const totalPages = Math.ceil(totalItems / pageSize)

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, dateRange])

  return (
    <div className="flex-1 bg-[#f8fafc] flex flex-col font-['Inter',sans-serif]">
      {/* ── HEADER ── */}
      <div className="bg-white px-[27px] py-[24px] border-b border-[#e2e8f0] flex justify-between items-center shrink-0">
        <h1 className="text-[20px] font-bold text-[#0f172a]">Registrations</h1>
        <div className="flex gap-[8px]">
          <Link
            href="/dashboard/admin/registrations/archive"
            className="flex items-center gap-[8px] px-[17px] py-[9px] border border-[#e2e8f0] rounded-[8px] text-[14px] font-semibold text-[#334155] bg-white shadow-sm transition-all hover:bg-gray-50"
          >
            <HiOutlineArchive className="text-[18px]" />
            Archive
          </Link>
          <button
            onClick={handleExport}
            className="flex items-center gap-[8px] px-[17px] py-[9px] border border-[#e2e8f0] rounded-[8px] bg-white text-[#334155] text-[14px] font-semibold hover:bg-gray-50 transition-all shadow-sm"
          >
            <HiOutlineDownload className="text-[18px]" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] pb-[32px]">
        {/* ── DESCRIPTION ── */}
        <div className="mt-[32px] mb-[16px]">
          <p className="text-[14px] text-[#64748b] leading-[20px]">
            Keep track of the most recent member registrations in your platform.
          </p>
        </div>

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
            <div className="w-[180px]">
              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                className="w-full !h-[44px] !rounded-[12px] font-['Inter']"
                variant="outlined"
                options={[
                  { value: 'All Status', label: 'Filter by Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(203,195,213,0.2)'
                }}
              />
            </div>

            <div className="w-[280px]">
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
              <span className="text-[14px] font-semibold text-[#B42318]">{selectedIds.size} registration(s) selected</span>
              <button
                onClick={toggleSelectAll}
                className="text-[14px] font-semibold text-[#7F56D9] bg-transparent border-0 cursor-pointer hover:underline"
              >
                {selectedIds.size === paginatedData.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-[8px]">
              <button
                onClick={handleArchiveSelected}
                className="h-[40px] px-[16px] rounded-[8px] border border-[#FDA29B] bg-white text-[#B42318] font-semibold flex items-center gap-[8px] hover:bg-[#FFF1F0] hover:border-[#F97066] transition-all cursor-pointer shadow-sm"
              >
                <HiOutlineArchive className="text-[18px]" />
                Archive Selected
              </button>

              <button
                onClick={handleDeleteSelected}
                className="h-[40px] px-[16px] rounded-[8px] border border-[#FDA29B] bg-[#FEF3F2] text-[#B42318] font-semibold flex items-center gap-[8px] hover:bg-[#FEE4E2] hover:border-[#F97066] transition-all cursor-pointer shadow-sm"
              >
                <HiOutlineTrash className="text-[18px]" />
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* ── DATA TABLE CARD ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[rgba(248,250,252,0.5)]">
                <th className="px-[23px] py-[15px] w-[64px] border-b border-[#f1f5f9]">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                    onChange={toggleSelectAll}
                    className="w-[16px] h-[16px] rounded-[4px] border-[#cbd5e1] checked:accent-[#7f56d9]"
                  />
                </th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">NAME</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-nowrap">EMAIL ADDRESS</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-nowrap">PHONE NUMBER</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-nowrap">SUBMISSION DATE</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">STATUS</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-[60px] text-[#64748b]">Loading registries...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-[60px] text-[#64748b]">No registrations found.</td></tr>
              ) : (
                paginatedData.map((app) => (
                  <tr key={app.id} className="hover:bg-[#f8fafc]/50 transition-colors h-[74px]">
                    <td className="px-[24px] py-[16px]">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelectRow(app.id)}
                        className="w-[16px] h-[16px] rounded-[4px] border-[#cbd5e1] checked:accent-[#7f56d9]"
                      />
                    </td>
                    <td className="px-[24px] py-[16px]">
                      <div className="flex items-center gap-[12px]">
                        <div className="w-[40px] h-[40px] rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden">
                          {app.candidat?.user?.avatar_url ? (
                            <img src={app.candidat.user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[12px] font-bold text-[#64748b]">
                              {app.candidat?.user?.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-semibold text-[#0f172a] truncate">
                            {app.candidat?.user?.user_name || 'Anonymous'}
                          </span>
                          <span className="text-[12px] text-[#64748b] truncate leading-[16px]">
                            {app.job?.title || 'Candidate'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-[24px] py-[26px] text-[14px] text-[#475569]">{app.candidat?.user?.email || '—'}</td>
                    <td className="px-[24px] py-[26px] text-[14px] text-[#475569]">{app.candidat?.user?.phone || '—'}</td>
                    <td className="px-[24px] py-[26px] text-[14px] text-[#475569]">
                      {new Date(app.applied_at || app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(app.applied_at || app.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-[24px] py-[26px]">
                      {app.status === 'pending' && (
                        <span className="px-[10px] py-[2px] rounded-full bg-[#fef3c7] text-[#b45309] text-[12px] font-medium">Pending</span>
                      )}
                      {app.status === 'accepted' && (
                        <span className="px-[10px] py-[2px] rounded-full bg-[#dcfce7] text-[#15803d] text-[12px] font-medium">Approved</span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="px-[10px] py-[2px] rounded-full bg-[#fee2e2] text-[#b91c1c] text-[12px] font-medium">Rejected</span>
                      )}
                    </td>
                    <td className="px-[24px] py-[16px]">
                      <div className="flex justify-start items-center">
                        <div className="grid grid-cols-[32px_32px_32px] gap-[4px] items-center">
                          {app.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  setAppToApprove(app)
                                  setIsModalVisible(true)
                                }}
                                className="w-[32px] h-[32px] rounded-[6px] text-emerald-600 hover:bg-emerald-50 transition-all font-bold flex items-center justify-center"
                                title="Approve"
                              >
                                <HiOutlineCheck size={20} />
                              </button>
                              <button
                                onClick={() => router.push(`/dashboard/admin/registrations/${app.candidat_id}?jobId=${app.job_id}`)}
                                className="w-[32px] h-[32px] rounded-[6px] text-[#7f56d9] hover:bg-[#f9f5ff] transition-all flex items-center justify-center"
                                title="View Details"
                              >
                                <HiOutlineEye size={20} />
                              </button>
                              <button
                                onClick={() => {
                                  setAppToDelete(app)
                                  setIsDeleteModalVisible(true)
                                }}
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
                                onClick={() => router.push(`/dashboard/admin/registrations/${app.candidat_id}?jobId=${app.job_id}`)}
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

          {/* ── PAGINATION ── */}
          {totalItems > pageSize && (
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

      {/* Confirmation Modals (Styled for Fidelity) */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .hiring-modal .ant-modal-content {
          border-radius: 20px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .hiring-modal .ant-modal-header {
          border-bottom: 1px solid #eaecf0;
          margin-bottom: 0;
          padding: 32px 32px 16px 32px;
        }
        .hiring-modal .ant-modal-body {
          padding: 32px;
        }
        .hiring-modal input, .hiring-modal .ant-select-selector, .hiring-modal .ant-picker {
          height: 44px !important;
          border-radius: 8px !important;
          border-color: #d0d5dd !important;
        }
      `}</style>

      {/* Re-use existing modal logic but keep them visually consistent with the new style */}
      {isModalVisible && appToApprove && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-[20px] p-[40px] w-full max-w-[600px] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-[64px] h-[64px] rounded-[14px] bg-[#ecfdf5] border border-[#abefc6] flex items-center justify-center mb-6">
                <HiOutlineCheck className="text-[#10b981] text-[32px]" />
              </div>
              <h3 className="text-[24px] font-bold text-[#101828] mb-3">Accept {appToApprove.candidat?.user?.user_name}?</h3>
              <p className="text-[16px] text-[#667085] leading-relaxed mb-8 max-w-[440px]">
                Confirm accepting this registration for the role of <span className="font-bold text-[#101828]">{appToApprove.job?.title}</span>.
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setIsModalVisible(false)} className="flex-1 h-[48px] border border-[#d0d5dd] rounded-[10px] font-bold text-[#344054] hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={() => { setIsModalVisible(false); setIsHiringModal(true); }} className="flex-1 h-[48px] bg-[#7f56d9] text-white rounded-[10px] font-bold hover:bg-[#6941c6] transition-all shadow-md shadow-[#7f56d9]/20">Confirm Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalVisible && appToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-[20px] p-[40px] w-full max-w-[600px] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-[64px] h-[64px] rounded-[14px] bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center mb-6">
                <HiOutlineX className="text-[#dc2626] text-[32px]" />
              </div>
              <h3 className="text-[24px] font-bold text-[#101828] mb-3">Reject Registration?</h3>
              <p className="text-[16px] text-[#667085] leading-relaxed mb-8 max-w-[400px]">
                Are you sure you want to reject <span className="font-bold text-[#101828]">{appToDelete.candidat?.user?.user_name}</span>? This action is irreversible.
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setIsDeleteModalVisible(false)} className="flex-1 h-[48px] border border-[#d0d5dd] rounded-[10px] font-bold text-[#344054] hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={() => handleAction(appToDelete, 'rejected')} className="flex-1 h-[48px] bg-[#d11010] text-white rounded-[10px] font-bold hover:bg-[#b91c1c] transition-all shadow-md shadow-red-100">Reject Candidate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hiring Details Modal (Ant Design Overridden) */}
      <Modal
        title={
          <div className="pt-2">
            <h2 className="text-[22px] font-bold text-[#101828] mb-1">Contract Information</h2>
            <p className="text-[#64748b] text-[14px] font-normal">Complete the hiring details to finalize the process.</p>
          </div>
        }
        open={isHiringModal}
        onCancel={() => setIsHiringModal(false)}
        footer={null}
        centered
        width={560}
        className="hiring-modal"
      >
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#344054]">Hiring Date <span className="text-red-500">*</span></label>
            <DatePicker
              className="w-full"
              placeholder="Select date..."
              value={hiringData.hire_date}
              onChange={(date) => setHiringData({ ...hiringData, hire_date: date as any })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#344054]">Department <span className="text-red-500">*</span></label>
            <Select
              className="w-full"
              placeholder="Select department..."
              value={hiringData.department}
              onChange={(val) => setHiringData({ ...hiringData, department: val })}
              options={[
                { value: 'IT', label: 'IT & Development' },
                { value: 'HR', label: 'Human Resources' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Sales', label: 'Sales' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Business', label: 'Business Development' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#344054]">Vacation Balance Accrual (days/month) <span className="text-red-500">*</span></label>
            <Input
              className="w-full"
              placeholder="Ex: 2.1"
              value={hiringData.monthly_rate}
              onChange={(e) => setHiringData({ ...hiringData, monthly_rate: e.target.value.replace(',', '.') as any })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-8">
            <button
              onClick={() => setIsHiringModal(false)}
              className="px-6 h-[44px] rounded-[10px] border border-[#d0d5dd] font-bold text-[#344054] hover:bg-gray-50 transition-all font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleHiringDone}
              className="px-8 h-[44px] rounded-[10px] bg-[#7f56d9] text-white font-bold hover:bg-[#6941c6] shadow-md shadow-[#7f56d9]/20 transition-all font-bold"
            >
              Confirm & Finalize
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .hiring-modal .ant-modal-content {
          border-radius: 20px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .hiring-modal .ant-modal-header {
          border-bottom: 1px solid #eaecf0;
          margin-bottom: 0;
          padding: 32px 32px 16px 32px;
        }
        .hiring-modal .ant-modal-body {
          padding: 32px;
        }
        .hiring-modal input, .hiring-modal .ant-select-selector, .hiring-modal .ant-picker {
          height: 44px !important;
          border-radius: 8px !important;
          border-color: #d0d5dd !important;
        }
      `}</style>
    </div>
  )
}
