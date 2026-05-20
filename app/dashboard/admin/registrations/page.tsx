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
} from 'react-icons/hi'

import { getAllUsers, updateUserStatus as updateGlobalUserStatus, getProfile } from '@/app/api/profile'
import { getAllApplicationsDetailed, updateApplicationStatus, archiveApplications, restoreApplications, deleteAllOtherApplications, hardDeleteApplications } from '@/app/api/applications'
import { getAllJobs, decrementJobSeats } from '@/app/api/job'
import { HiOutlineArchive, HiOutlineRefresh } from 'react-icons/hi'
import type { FullProfile } from '@/lib/database.types'

import { useApplications, queryKeys } from '@/lib/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Pagination, SearchBar, FilterBar } from '@/components'

export default function RegistrationsPage() {
  const searchParams = useSearchParams()
  const highlightParam = searchParams.get('highlight')
  
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState(highlightParam || '')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const pageSize = 10

  const { data: result, isLoading: loading } = useApplications({
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
  const [hiringData, setHiringData] = useState<{
    hire_date: any;
    department: string | undefined;
    monthly_rate: string | number | undefined;
    vacation_balance?: number;
  }>({
    hire_date: null,
    department: undefined,
    monthly_rate: undefined,
    vacation_balance: 0
  })

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [appToDelete, setAppToDelete] = useState<any | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const router = useRouter()

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    try {
      const { error } = await archiveApplications(ids)
      if (error) throw error
      message.success(`${ids.length} registration(s) archived successfully`)
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: queryKeys.applications })
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
          const { error } = await hardDeleteApplications(ids)
          if (error) throw error

          message.success(`${ids.length} registration(s) deleted permanently`)
          setSelectedIds(new Set())
          queryClient.invalidateQueries({ queryKey: queryKeys.applications })
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
    const { error: appError } = await updateApplicationStatus(application.id, status)

    if (!appError) {
      if (status === 'accepted') {
        const { error: statusError } = await updateGlobalUserStatus(application.candidate_id, 'approved', hiringDetails)

        if (!statusError) {
          await deleteAllOtherApplications(application.candidate_id, application.id)
          if (application.job_id) {
            await decrementJobSeats(application.job_id)
          }
        }
      }

      setIsModalVisible(false)
      setIsHiringModal(false)
      setIsDeleteModalVisible(false)
      message.success(`Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`)
      queryClient.invalidateQueries({ queryKey: queryKeys.applications })
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

    
    const hire_date = hiringData.hire_date.format('YYYY-MM-DD')

    await handleAction(appToApprove, 'accepted', {
      hire_date,
      department: hiringData.department,
      monthly_rate: hiringData.monthly_rate,
      position: appToApprove.job?.title || 'Employee',
      candidate_id: appToApprove.candidate_id
    })
  }

  // Server-side filtered data is directly available in 'applications'
  const paginatedData = applications

  const totalPages = Math.ceil(totalItems / pageSize)

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, dateRange])

  return (
    <div className="flex-1 bg-[#f8fafc] flex flex-col font-['Inter',sans-serif] min-w-0">
      {/* ── HEADER ── */}
      <div className="bg-white px-4 md:px-[27px] py-4 md:py-[24px] border-b border-[#e2e8f0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <h1 className="text-[20px] font-bold text-[#0f172a]">Registrations</h1>
        <div className="flex flex-wrap gap-[8px]">
          <Link
            href="/dashboard/admin/registrations/archive"
            className="flex items-center gap-[8px] px-[17px] py-[9px] border border-[#e2e8f0] rounded-[8px] text-[14px] font-semibold text-[#334155] bg-white shadow-sm transition-all hover:bg-gray-50"
          >
            <HiOutlineArchive className="text-[18px]" />
            Archive
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-[32px] pb-[32px]">
        {/* ── DESCRIPTION ── */}
        <div className="mt-[32px] mb-[16px]">
          <p className="text-[14px] text-[#64748b] leading-[20px]">
            Keep track of the most recent member registrations in your platform.
          </p>
        </div>

        {/* ── SEARCH & FILTERS BAR ── */}
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search ..." />

          <div className="flex flex-col sm:flex-row gap-[16px] items-center w-full xl:w-auto">
            <div className="w-full sm:w-[180px]">
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
        </FilterBar>

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
        <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-auto">
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
                <th className="px-[16px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">NAME</th>
                <th className="px-[16px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-nowrap">EMAIL ADDRESS</th>
                <th className="px-[16px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-nowrap">PHONE NUMBER</th>
                <th className="px-[16px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-nowrap">SUBMISSION DATE</th>
                <th className="px-[16px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">STATUS</th>
                <th className="px-[16px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-[60px] text-[#64748b]">Loading registries...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-[60px] text-[#64748b]">No registrations found.</td></tr>
              ) : (
                paginatedData.map((app) => {
                  const isHighlighted = highlightParam === app.candidate?.user?.email
                  return (
                    <tr 
                      key={app.id} 
                      className={`transition-all duration-500 h-[74px] ${
                        isHighlighted 
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500 shadow-inner animate-pulse-subtle' 
                          : 'hover:bg-[#f8fafc]/50 hover:shadow-sm'
                      }`}
                    >
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
                          {app.candidate?.user?.avatar_url ? (
                            <img src={app.candidate.user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[12px] font-bold text-[#64748b]">
                              {app.candidate?.user?.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-semibold text-[#0f172a] truncate">
                            {app.candidate?.user?.user_name || 'Anonymous'}
                          </span>
                          <span className="text-[12px] text-[#64748b] truncate leading-[16px]">
                            {app.job?.title || 'Candidate'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-[16px] py-[26px] text-[14px] text-[#475569] truncate max-w-[200px]">{app.candidate?.user?.email || '—'}</td>
                    <td className="px-[16px] py-[26px] text-[14px] text-[#475569]">{app.candidate?.user?.phone || '—'}</td>
                    <td className="px-[16px] py-[26px] text-[14px] text-[#475569]">
                      {new Date(app.applied_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(app.applied_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-[16px] py-[26px]">
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
                    <td className="px-[16px] py-[16px]">
                      <div className="flex justify-start items-center">
                        <div className="grid grid-cols-[32px_32px_32px] gap-[4px] items-center">
                          {app.status === 'pending' ? (
                            <>
                              <button
                                onClick={async () => {
                                  setAppToApprove(app)
                                  if (app.candidate?.user?.role === 'employee') {
                                    const { data: prof } = await getProfile(app.candidate_id)
                                    if (prof?.employee) {
                                      setHiringData({
                                        hire_date: dayjs(prof.employee.hire_date) as any,
                                        department: prof.employee.department as any,
                                        monthly_rate: prof.employee.monthly_rate as any,
                                        vacation_balance: prof.employee.vacation_balance || 0
                                      })
                                    }
                                  } else {
                                    setHiringData({
                                      hire_date: null,
                                      department: undefined,
                                      monthly_rate: undefined
                                    })
                                  }
                                  setIsModalVisible(true)
                                }}
                                className="w-[32px] h-[32px] rounded-[6px] text-emerald-600 hover:bg-emerald-50 transition-all font-bold flex items-center justify-center"
                                title="Approve"
                              >
                                <HiOutlineCheck size={20} />
                              </button>
                              <button
                                onClick={() => router.push(`/dashboard/admin/registrations/${app.candidate_id}?jobId=${app.job_id}`)}
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
                                onClick={() => router.push(`/dashboard/admin/registrations/${app.candidate_id}?jobId=${app.job_id}`)}
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
                  )
                })
              )}
            </tbody>
          </table>
          </div>

          {/* ── PAGINATION ── */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="px-6 py-4 border-t border-[#f1f5f9] bg-white"
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalVisible && appToApprove && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-10 w-full max-w-[500px] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
                <HiOutlineCheck className="text-emerald-500 text-3xl" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Accept Candidate?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                You are about to accept <span className="font-semibold text-slate-900">{appToApprove.candidate?.user?.user_name}</span> for the position of <span className="font-semibold text-slate-900">{appToApprove.job?.title}</span>.
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsModalVisible(false)} 
                  className="flex-1 h-12 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setIsModalVisible(false); setIsHiringModal(true); }} 
                  className="flex-1 h-12 bg-[#7f56d9] text-white rounded-xl font-bold hover:bg-[#6941c6] transition-all shadow-lg shadow-[#7f56d9]/20"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalVisible && appToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-[20px] p-[40px] w-full max-w-[600px] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-[64px] h-[64px] rounded-[14px] bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center mb-6">
                <HiOutlineX className="text-[#dc2626] text-[32px]" />
              </div>
              <h3 className="text-[24px] font-bold text-[#101828] mb-3">Reject Registration?</h3>
              <p className="text-[16px] text-[#667085] leading-relaxed mb-8 max-w-[400px]">
                Are you sure you want to reject <span className="font-bold text-[#101828]">{appToDelete.candidate?.user?.user_name}</span>? This action is irreversible.
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setIsDeleteModalVisible(false)} className="flex-1 h-[48px] border border-[#d0d5dd] rounded-[10px] font-bold text-[#344054] hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={() => handleAction(appToDelete, 'rejected')} className="flex-1 h-[48px] bg-[#d11010] text-white rounded-[10px] font-bold hover:bg-[#b91c1c] transition-all shadow-md shadow-red-100">Reject Candidate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hiring Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-bold text-[#101828]">Contract Information</h2>
            {appToApprove?.candidate?.user?.role === 'employee' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[12px] font-medium border border-blue-100">
                Internal Employee
              </span>
            )}
          </div>
        }
        open={isHiringModal}
        onCancel={() => setIsHiringModal(false)}
        footer={null}
        centered
        width={560}
        styles={{
          mask: { },
          body: { borderRadius: '20px', padding: '32px' },
          header: { borderBottom: '1px solid #eaecf0', paddingBottom: '16px', marginBottom: '24px' }
        }}
      >
        <div className="space-y-6 pt-2">
          {appToApprove?.candidate?.user?.role === 'employee' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#f9fafb] rounded-xl border border-[#eaecf0]">
                  <p className="text-[12px] font-medium text-[#667085] mb-1">Initial Hire Date</p>
                  <p className="text-[16px] font-bold text-[#101828]">
                    {hiringData.hire_date ? hiringData.hire_date.format('DD/MM/YYYY') : '—'}
                  </p>
                </div>
                <div className="p-4 bg-[#f9fafb] rounded-xl border border-[#eaecf0]">
                  <p className="text-[12px] font-medium text-[#667085] mb-1">Vacation Balance</p>
                  <p className="text-[16px] font-bold text-[#101828]">
                    {hiringData.vacation_balance || 0} days
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#344054]">New Department <span className="text-red-500">*</span></label>
                <Select
                  size="large"
                  className="w-full"
                  placeholder="Select new department..."
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
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#344054]">Hiring Date <span className="text-red-500">*</span></label>
                <DatePicker
                  size="large"
                  className="w-full"
                  placeholder="Select date..."
                  value={hiringData.hire_date}
                  onChange={(date) => setHiringData({ ...hiringData, hire_date: date as any })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#344054]">Department <span className="text-red-500">*</span></label>
                <Select
                  size="large"
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
                <label className="text-[14px] font-semibold text-[#344054]">Rate per month (Days/month) <span className="text-red-500">*</span></label>
                <Input
                  size="large"
                  className="w-full"
                  placeholder="Ex: 1.5"
                  value={hiringData.monthly_rate}
                  onChange={(e) => setHiringData({ ...hiringData, monthly_rate: e.target.value.replace(',', '.') as any })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-8">
            <button
              onClick={() => setIsHiringModal(false)}
              className="px-6 h-[44px] rounded-[10px] border border-[#d0d5dd] font-bold text-[#344054] hover:bg-gray-50 transition-all font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleHiringDone}
              className="px-8 h-[44px] rounded-[10px] bg-[#7f56d9] text-white font-bold hover:bg-[#6941c6] shadow-md shadow-[#7f56d9]/20 transition-all"
            >
              Confirm
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

        @keyframes pulse-subtle {
          0% { background-color: rgba(16, 185, 129, 0.05); }
          50% { background-color: rgba(16, 185, 129, 0.15); }
          100% { background-color: rgba(16, 185, 129, 0.05); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}

