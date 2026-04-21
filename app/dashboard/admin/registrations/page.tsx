'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, message, Modal, DatePicker, Select, Input, Avatar } from 'antd'
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
  HiOutlineTrash
} from 'react-icons/hi'
import { BiExport } from 'react-icons/bi'
import { getAllUsers, updateUserStatus as updateGlobalUserStatus, exportToCSV, downloadCSV } from '@/api/profile'
import { getAllCandidaturesDetailed, updateCandidatureStatus, archiveCandidatures, deleteAllOtherCandidatures } from '@/api/candidatures'
import { getAllJobs, decrementJobSeats } from '@/api/job'
import type { FullProfile } from '@/api/database.types'

export default function RegistrationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [dateFilter, setDateFilter] = useState('All Time')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10 // Increased for better UX, will keep it dynamic if needed
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

  const [isPermDeleteModalVisible, setIsPermDeleteModalVisible] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const router = useRouter()

  const fetchApplications = async () => {
    setLoading(true)
    const { data } = await getAllCandidaturesDetailed()
    setApplications(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchApplications() }, [])

  const handleArchiveSelected = async () => {
    const ids = Array.from(selectedIds)
    const { error } = await archiveCandidatures(ids)
    if (!error) {
      setIsPermDeleteModalVisible(false)
      setSelectedIds(new Set())
      message.success(`${ids.length} registration(s) archived successfully`)
      fetchApplications()
    } else {
      message.error('Failed to archive registrations')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(u => u.id)))
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
        const { error: statusError } = await updateGlobalUserStatus(application.postulant_id, 'approved', hiringDetails)

        if (!statusError) {
          await deleteAllOtherCandidatures(application.postulant_id, application.id)
          if (application.job_id) {
            await decrementJobSeats(application.job_id)
          }
        }
      }

      setIsModalVisible(false)
      setIsHiringModal(false)
      setIsDeleteModalVisible(false)
      message.success(`Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`)
      fetchApplications()
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
      monthly_rate: hiringData.monthly_rate
    })
  }

  const handleExport = () => {
    const usersToExport = Array.from(new Set(filtered.map(app => app.postulant?.user)))
    const csv = exportToCSV(usersToExport as any[])
    downloadCSV(csv, 'registrations.csv')
  }

  const filtered = applications.filter(app => {
    const u = app.postulant?.user
    const j = app.job

    const matchSearch =
      (u?.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (j?.title ?? '').toLowerCase().includes(search.toLowerCase())

    const matchStatus =
      statusFilter === 'All Status' ||
      (statusFilter === 'Pending' && app.status === 'pending') ||
      (statusFilter === 'Approved' && app.status === 'accepted') ||
      (statusFilter === 'Rejected' && app.status === 'rejected')

    const matchDate = dateFilter === 'All Time' || (() => {
      const appDate = new Date(app.applied_at || app.created_at || '')
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

  // Pagination Logic
  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <div className="flex-1 p-[32px] h-full overflow-y-auto bg-transparent">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#101828] tracking-tight">Registrations</h1>
          <p className="text-[15px] text-[#667085] mt-1 font-medium italic opacity-80">Track and manage incoming candidate registrations.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => router.push('/dashboard/admin/registrations/archive')}
            className="h-[42px] px-4 border border-[#d0d5dd] rounded-[10px] bg-white font-semibold text-[14px] text-[#344054] cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <FolderOpenOutlined className="text-[17px] opacity-70" />
            Archive
          </button>

          <button onClick={handleExport} className="h-[42px] px-4 border border-[#d0d5dd] rounded-[10px] bg-white font-semibold text-[14px] text-[#344054] cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
            <BiExport className="text-[20px] text-[#475467]" />
            Export
          </button>


        </div>
      </div>

      <div className="bg-white border border-[#eaecf0] rounded-[12px] shadow-sm overflow-hidden mb-[40px]">
        {/* ── TABLE HEADER SECTION ── */}
        <div className="px-6 py-5 border-b border-[#eaecf0] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
            {/* Search */}
            <div className="relative group w-full md:w-[320px]">
              <HiOutlineSearch className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[18px] text-[#667085]" />
              <input
                placeholder="Search candidates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-[42px] pr-[14px] py-[10px] border border-[#d0d5dd] rounded-[8px] bg-white text-[14px] text-[#101828] w-full focus:outline-none focus:ring-4 focus:ring-[#7f56d9]/10 focus:border-[#7f56d9] transition-all placeholder:text-[#667085] font-medium shadow-sm"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative group w-full md:w-auto">
              <div className="flex items-center gap-2 h-[42px] px-3.5 border border-[#d0d5dd] rounded-[8px] bg-white cursor-pointer hover:bg-gray-50 shadow-sm transition-all">
                <HiOutlineFilter className="text-[18px] text-[#667085]" />
                <span className="text-[14px] font-semibold text-[#344054] whitespace-nowrap">Status: {statusFilter}</span>
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All Status">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative group w-full md:w-auto">
              <div className="flex items-center gap-2 h-[42px] px-3.5 border border-[#d0d5dd] rounded-[8px] bg-white cursor-pointer hover:bg-gray-50 shadow-sm transition-all">
                <HiOutlineCalendar className="text-[18px] text-[#667085]" />
                <span className="text-[14px] font-semibold text-[#344054] whitespace-nowrap">Date: {dateFilter}</span>
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="All Time">All Time</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── BULK ACTION TOOLBAR (Figma Style) ── */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#eaecf0] flex items-center justify-between animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center gap-[12px]">
              <span className="text-[14px] font-bold text-[#101828]">
                {selectedIds.size} registration{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="w-[1px] h-[16px] bg-[#d0d5dd] mx-2"></div>
              <button 
                onClick={toggleSelectAll}
                className="text-[14px] font-bold text-[#7f56d9] hover:underline cursor-pointer bg-transparent border-none"
              >
                {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-[14px] font-bold text-[#667085] hover:underline cursor-pointer bg-transparent border-none"
              >
                Clear Selection
              </button>
            </div>
            
            <button
              onClick={() => setIsPermDeleteModalVisible(true)}
              className="h-[40px] px-[14px] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] flex items-center gap-2 text-[#d92d20] font-bold text-[14px] hover:bg-[#fee2e2] transition-all shadow-sm active:scale-95"
            >
              <HiOutlineTrash className="text-[18px]" />
              Archive Selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className="px-6 py-3 text-left border-b border-[#eaecf0] w-[40px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded-md border-[#d0d5dd] cursor-pointer accent-[#7f56d9] focus:ring-[#7f56d9] transition-all"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-semibold border-b border-[#eaecf0] uppercase tracking-wider bg-[#f9fafb]">Name</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-semibold border-b border-[#eaecf0] uppercase tracking-wider bg-[#f9fafb]">Email address</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-semibold border-b border-[#eaecf0] uppercase tracking-wider bg-[#f9fafb]">Phone Number</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-semibold border-b border-[#eaecf0] uppercase tracking-wider bg-[#f9fafb]">Submission Date</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-semibold border-b border-[#eaecf0] uppercase tracking-wider bg-[#f9fafb]">Status</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-semibold border-b border-[#eaecf0] uppercase tracking-wider bg-[#f9fafb]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 text-[14px]">Loading registrations...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 text-[14px]">No registrations found.</td></tr>
              ) : (
                paginatedData.map((app) => (
                  <tr key={app.id} className="hover:bg-[#f9fafb] transition-colors border-b border-[#eaecf0] h-[74px]">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-md border-[#d0d5dd] cursor-pointer accent-[#7f56d9] transition-all"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelectRow(app.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-[12px]">
                        <div className="relative group">
                          <Avatar
                            size={44}
                            src={app.postulant?.user?.avatar_url}
                            className="bg-[#f9f5ff] text-[#7f56d9] font-bold text-[15px] border-2 border-white shadow-sm"
                          >
                            {app.postulant?.user?.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#101828] leading-tight hover:text-[#7f56d9] cursor-pointer transition-colors">
                            {app.postulant?.user?.user_name || 'Anonymous User'}
                          </span>
                          <span className="text-[13px] text-[#667085] mt-0.5 font-medium">
                            {app.job?.title || 'Applied Position'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#475467] font-medium">
                      {app.postulant?.user?.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#475467] font-semibold tracking-tight">
                      {app.postulant?.user?.phone || '+216 -- --- ---'}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#667085]">
                      {new Date(app.applied_at || app.created_at || '').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {app.status === 'pending' && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                          Pending
                        </div>
                      )}
                      {app.status === 'accepted' && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                          Approved
                        </div>
                      )}
                      {app.status === 'rejected' && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                          Rejected
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-[6px] items-center">
                        <button
                          onClick={() => router.push(`/dashboard/admin/registrations/${app.postulant_id}?jobId=${app.job_id}`)}
                          title="View Details"
                          className="w-[38px] h-[38px] rounded-[10px] bg-white border border-[#d0d5dd] flex items-center justify-center text-[#475467] hover:bg-gray-50 hover:text-[#7f56d9] transition-all shadow-sm active:scale-90"
                        >
                          <HiOutlineEye className="text-[19px]" />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setAppToApprove(app)
                                setIsModalVisible(true)
                              }}
                              title="Approve"
                              className="w-[38px] h-[38px] rounded-[10px] bg-white border border-[#d0d5dd] flex items-center justify-center text-[#475467] hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-90"
                            >
                              <HiOutlineCheck className="text-[19px]" />
                            </button>
                            <button
                              onClick={() => {
                                setAppToDelete(app)
                                setIsDeleteModalVisible(true)
                              }}
                              title="Reject"
                              className="w-[38px] h-[38px] rounded-[10px] bg-white border border-[#d0d5dd] flex items-center justify-center text-[#475467] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm active:scale-90"
                            >
                              <HiOutlineX className="text-[19px]" />
                            </button>
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


        {/* ── PAGINATION ── */}
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#eaecf0] bg-white">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`h-[40px] px-[14px] border border-[#d0d5dd] rounded-[10px] bg-white font-bold text-[14px] text-[#344054] cursor-pointer flex items-center gap-[8px] hover:bg-gray-50 transition-all shadow-sm active:scale-95 ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <HiOutlineChevronLeft className="text-[18px]" /> Previous
            </button>
            <div className="flex gap-[4px] items-center">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = currentPage === pageNum;
                if (totalPages > 7 && (pageNum > 1 && pageNum < totalPages && Math.abs(pageNum - currentPage) > 2)) {
                  if (pageNum === 2 || pageNum === totalPages - 1) return <div key={pageNum} className="w-[36px] h-[36px] flex items-center justify-center text-[#667085] font-bold">...</div>
                  return null;
                }
                return (
                  <div
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-[14px] cursor-pointer font-bold transition-all ${isActive ? 'bg-[#f4ebff] text-[#7f56d9] ring-1 ring-[#7f56d9]/30' : 'text-[#667085] hover:bg-gray-100 hover:text-[#101828]'
                      }`}
                  >
                    {pageNum}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`h-[40px] px-[14px] border border-[#d0d5dd] rounded-[10px] bg-white font-bold text-[14px] text-[#344054] cursor-pointer flex items-center gap-[8px] hover:bg-gray-50 transition-all shadow-sm active:scale-95 ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Next <HiOutlineChevronRight className="text-[18px]" />
            </button>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      {isModalVisible && appToApprove && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]"
          onClick={() => setIsModalVisible(false)}
        >
          <div
            className="bg-white rounded-[20px] p-[40px] w-full max-w-[607px] shadow-2xl animate-in fade-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-[64px] h-[64px] rounded-[14px] bg-[#ecfdf5] flex items-center justify-center mb-[24px] border border-[#abefc6]">
                <HiOutlineCheck className="text-[#10b981] text-[32px]" />
              </div>

              <h3 className="text-[24px] font-bold text-[#101828] text-center mb-[12px] tracking-tight">
                Are you sure you want to Accept {appToApprove.postulant?.user?.user_name || 'this candidate'}?
              </h3>

              <p className="text-[16px] text-[#667085] text-center leading-relaxed mb-[36px] max-w-[480px]">
                By approving this candidature, the candidate will be accepted for the role of <span className="font-bold text-[#101828]">{appToApprove.job?.title || 'the selected position'}</span>.
              </p>

              <div className="flex gap-[16px] w-full">
                <button
                  onClick={() => setIsModalVisible(false)}
                  className="flex-1 h-[52px] border border-[#d0d5dd] rounded-[10px] bg-white text-[#344054] font-bold text-[16px] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsModalVisible(false)
                    setIsHiringModal(true)
                  }}
                  className="flex-1 h-[52px] bg-[#7c3aed] text-white rounded-[10px] font-bold text-[16px] hover:bg-[#6d28d9] transition-all shadow-sm active:scale-95 shadow-[#7c3aed]/20"
                >
                  Confirm Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      {isDeleteModalVisible && appToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]"
          onClick={() => setIsDeleteModalVisible(false)}
        >
          <div
            className="bg-white rounded-[20px] p-[40px] w-full max-w-[607px] shadow-2xl animate-in fade-in zoom-in duration-300 border-b-4 border-red-500"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-[64px] h-[64px] rounded-[14px] bg-[#fef2f2] flex items-center justify-center mb-[24px] border border-[#fecaca]">
                <HiOutlineX className="text-[#dc2626] text-[32px]" />
              </div>

              <h3 className="text-[24px] font-bold text-[#101828] text-center mb-[12px] tracking-tight">
                Reject Candidate {appToDelete.postulant?.user?.user_name || ''}?
              </h3>

              <p className="text-[16px] text-[#667085] text-center leading-relaxed mb-[36px] max-w-[480px]">
                 Are you sure you want to reject this registration? Local data will be preserved but the application status will change to rejected.
              </p>

              <div className="flex gap-[16px] w-full">
                <button
                  onClick={() => setIsDeleteModalVisible(false)}
                  className="flex-1 h-[52px] border border-[#d0d5dd] rounded-[10px] bg-white text-[#344054] font-bold text-[16px] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(appToDelete, 'rejected')}
                  className="flex-1 h-[52px] bg-[#d92d20] text-white rounded-[10px] font-bold text-[16px] hover:bg-[#b42318] transition-all shadow-sm active:scale-95 shadow-red-100"
                >
                  Reject Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {isPermDeleteModalVisible && selectedIds.size > 0 && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4 backdrop-blur-[2px]"
          onClick={() => setIsPermDeleteModalVisible(false)}
        >
          <div
            className="bg-white rounded-[20px] p-[40px] w-full max-w-[607px] shadow-2xl animate-in fade-in zoom-in duration-300 border-2 border-[#FDA29B]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-[64px] h-[64px] rounded-[14px] bg-[#FEF2F2] flex items-center justify-center mb-[24px] shadow-sm">
                <HiOutlineX className="text-[#DC2626] text-[32px]" />
              </div>

              <h3 className="text-[24px] font-bold text-[#101828] text-center mb-[12px] tracking-tight">
                Archive {selectedIds.size} registration{selectedIds.size > 1 ? 's' : ''}?
              </h3>

              <p className="text-[16px] text-[#667085] text-center leading-relaxed mb-[36px] max-w-[480px]">
                This will move the selected registrations to the archive. They can be restored later or permanently deleted from the archive view.
              </p>

              <div className="flex gap-[16px] w-full">
                <button
                  onClick={() => setIsPermDeleteModalVisible(false)}
                  className="flex-1 h-[52px] border border-[#d0d5dd] rounded-[10px] bg-white text-[#344054] font-bold text-[16px] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveSelected}
                  className="flex-1 h-[52px] bg-[#7c3aed] text-white rounded-[10px] font-bold text-[16px] hover:bg-[#6d28d9] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Confirm Archiving
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hiring Details Modal */}
      <Modal
        title={
          <div className="pt-4 px-2">
            <h2 className="text-[20px] font-bold text-[#101828] mb-1">Hiring Approval</h2>
            <p className="text-[#475467] text-[14px] font-normal leading-relaxed">Please provide the necessary contract details to finalize the hiring of this candidate.</p>
          </div>
        }
        open={isHiringModal}
        onCancel={() => setIsHiringModal(false)}
        footer={null}
        centered
        width={600}
        className="hiring-modal"
      >
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#344054]">Hiring date</label>
            <DatePicker
              className="w-full h-[48px] rounded-lg border-[#D0D5DD]"
              placeholder="Select date..."
              suffixIcon={<CalendarOutlined className="text-gray-400" />}

              value={hiringData.hire_date}
              onChange={(date) => setHiringData({ ...hiringData, hire_date: date as any })}
            />
            <p className="text-[12px] text-[#667085]">Select the official start date for this employee.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#344054]">Departement</label>
            <Select
              className="w-full h-[48px] rounded-lg border-[#D0D5DD]"
              placeholder="Select department..."
              suffixIcon={<SolutionOutlined className="text-gray-400" />}
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
            <p className="text-[12px] text-[#667085]">Choose the department this employee will join.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-[#344054]">Rate per month (jours/mois)</label>
            <Input
              className="w-full h-[48px] rounded-lg border-[#D0D5DD]"
              placeholder="Ex: 1.5"
              value={hiringData.monthly_rate}
              onChange={(e) => {
                const val = e.target.value.replace(',', '.');
                setHiringData({ ...hiringData, monthly_rate: val as any });
              }}
            />
            <p className="text-[12px] text-[#667085]">Définissez combien de jours de congés l&apos;employé cumule chaque mois.</p>
          </div>

          <div className="flex justify-end gap-[12px] pt-6 border-t border-[#eaecf0]">
            <button
              onClick={() => setIsHiringModal(false)}
              className="px-6 h-[44px] rounded-[10px] border border-[#d0d5dd] font-bold text-[#344054] hover:bg-gray-50 bg-white shadow-sm transition-all active:scale-95 text-[14px]"
            >
              Cancel
            </button>
            <button
              onClick={handleHiringDone}
              className="px-8 h-[44px] rounded-[10px] bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/20 transition-all active:scale-95 text-[14px]"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .hiring-modal .ant-modal-content {
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .hiring-modal .ant-modal-header {
          border-bottom: 1px solid #eaecf0;
          margin-bottom: 0;
          padding: 24px;
        }
        .hiring-modal .ant-modal-body {
          padding: 24px;
        }
        .hiring-modal .ant-select-selector {
          height: 48px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          border-color: #d0d5dd !important;
          font-family: inherit !important;
        }
        .hiring-modal .ant-picker {
          height: 48px !important;
          border-radius: 8px !important;
          border-color: #d0d5dd !important;
          width: 100%;
          font-family: inherit !important;
        }
      `}</style>
    </div>
  )
}
