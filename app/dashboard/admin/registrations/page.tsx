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
import { getAllUsers, updateUserStatus as updateGlobalUserStatus, exportToCSV, downloadCSV } from '@/api/profile'
import { getAllCandidaturesDetailed, updateCandidatureStatus, archiveCandidatures, deleteAllOtherCandidatures } from '@/api/candidatures'
import { getAllJobs, decrementJobSeats } from '@/api/job'
import type { FullProfile } from '@/api/database.types'

export default function RegistrationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 2
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
    return matchSearch
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
      <div className="flex justify-between items-center mb-[32px]">
        <div>
           <h1 className="text-[30px] font-medium text-[#101828]">Registrations</h1>
           <p className="text-[16px] text-[#667085] mt-1">Manage and review incoming candidate applications.</p>
        </div>
        <div className="flex gap-[12px] items-center">
          <button 
            onClick={() => router.push('/dashboard/admin/registrations/archive')}
            className="h-[44px] px-[18px] border border-[#d0d5dd] rounded-[8px] bg-white font-medium text-[14px] text-[#344054] cursor-pointer flex items-center gap-[8px] hover:bg-gray-50 transition-all shadow-sm"
          >
            <FolderOpenOutlined className="text-[16px] opacity-70" />
            Archive
          </button>
          
          <button onClick={handleExport} className="h-[44px] px-[18px] border border-[#d0d5dd] rounded-[8px] bg-white font-medium text-[14px] text-[#344054] cursor-pointer flex items-center gap-[8px] hover:bg-gray-50 transition-all shadow-sm">
            <img src="/assets/export.svg" className="w-[20px] h-[20px]" alt="export" />
            Export
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsPermDeleteModalVisible(true)}
              className="h-[44px] px-[18px] border border-[#7f56d9] rounded-[8px] bg-[#f9f5ff] font-semibold text-[14px] text-[#7f56d9] cursor-pointer flex items-center gap-[8px] hover:bg-[#f4ebff] transition-all shadow-sm animate-in fade-in slide-in-from-right-2"
            >
              📂 Archive {selectedIds.size}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#eaecf0] rounded-[12px] shadow-sm overflow-hidden mb-[40px]">
        {/* ── TABLE HEADER SECTION ── */}
        <div className="px-6 py-5 border-b border-[#eaecf0] flex justify-between items-center bg-white">
          <div>
            <h3 className="text-[18px] font-medium text-[#101828] mb-0">Latest Registrations</h3>
            <p className="text-[14px] text-[#667085] mt-1 mb-0">Keep track of registrations and their status.</p>
          </div>
          <div className="relative group">
            <img src="/assets/search-small.svg" className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] opacity-50" alt="search" />
            <input
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-[40px] pr-[14px] py-[10px] border border-[#eaecf0] rounded-[8px] bg-white text-[14px] text-[#101828] w-[320px] focus:outline-none focus:ring-2 focus:ring-[#7f56d9]/20 transition-all placeholder:text-[#98a2b3] font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className="px-6 py-3 text-left border-b border-[#eaecf0] w-[40px]">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#d0d5dd] cursor-pointer accent-[#7f56d9]"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-medium border-b border-[#eaecf0] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-medium border-b border-[#eaecf0] uppercase tracking-wider">Email address</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-medium border-b border-[#eaecf0] uppercase tracking-wider">Submission Date</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-medium border-b border-[#eaecf0] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-[12px] text-[#667085] font-medium border-b border-[#eaecf0] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 text-[14px]">Loading registrations...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 text-[14px]">No registrations found.</td></tr>
              ) : (
                paginatedData.map((app) => (
                  <tr key={app.id} className="hover:bg-[#f9fafb] transition-colors h-[72px]">
                    <td className="px-6 py-4 border-b border-[#eaecf0]">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[#d0d5dd] cursor-pointer accent-[#7f56d9]"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelectRow(app.id)}
                      />
                    </td>
                    <td className="px-6 py-4 border-b border-[#eaecf0]">
                      <div className="flex items-center gap-[12px]">
                        <Avatar
                          size={40}
                          src={app.postulant?.user?.avatar_url}
                          className="bg-[#f9f5ff] text-[#7f56d9] font-semibold text-[14px]"
                        >
                          {app.postulant?.user?.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </Avatar>
                        <div>
                          <div className="text-[14px] font-medium text-[#101828]">{app.postulant?.user?.user_name || '—'}</div>
                          <div className="text-[14px] text-[#667085]">{app.job?.title || 'Postulant'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#eaecf0] text-[14px] text-[#667085]">
                      {app.postulant?.user?.email || '—'}
                    </td>
                    <td className="px-6 py-4 border-b border-[#eaecf0] text-[14px] text-[#667085]">
                      {new Date(app.applied_at || app.created_at || '').toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 border-b border-[#eaecf0]">
                      {app.status === 'pending' && <span className="px-[10px] py-[2px] rounded-full text-[12px] font-medium bg-[#fffaeb] text-[#b54708] border border-[#fedf89]">Pending</span>}
                      {app.status === 'accepted' && <span className="px-[10px] py-[2px] rounded-full text-[12px] font-medium bg-[#ecfdf3] text-[#067647] border border-[#abefc6]">Approved</span>}
                      {app.status === 'rejected' && <span className="px-[10px] py-[2px] rounded-full text-[12px] font-medium bg-[#fef3f2] text-[#b42318] border border-[#fecdca]">Rejected</span>}
                    </td>
                    <td className="px-6 py-4 border-b border-[#eaecf0]">
                      <div className="flex gap-[8px] items-center">
                        <button 
                          onClick={() => router.push(`/dashboard/admin/registrations/${app.postulant_id}?jobId=${app.job_id}`)} 
                          className="w-[36px] h-[36px] rounded-[8px] border border-[#d0d5dd] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                        >
                          <img src="/assets/eye.svg" className="w-[17px] h-[13px]" alt="view" />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setAppToApprove(app)
                                setIsModalVisible(true)
                              }}
                              className="w-[36px] h-[36px] rounded-[8px] border border-[#d0d5dd] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                            >
                              <img src="/assets/check-mark.svg" className="w-[17px] h-[13px]" alt="approve" />
                            </button>
                            <button
                              onClick={() => {
                                setAppToDelete(app)
                                setIsDeleteModalVisible(true)
                              }}
                              className="w-[36px] h-[36px] rounded-[8px] border border-[#d0d5dd] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                            >
                              <img src="/assets/cross.svg" className="w-[17px] h-[17px]" alt="reject" />
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
              className={`h-[40px] px-[14px] border border-[#d0d5dd] rounded-[8px] bg-white font-medium text-[14px] text-[#344054] cursor-pointer flex items-center gap-[8px] hover:bg-gray-50 transition-all shadow-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <img src="/assets/arrow-left.svg" className="w-[16px] h-[16px]" alt="" /> Previous
            </button>
            <div className="flex gap-[2px] items-center">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = currentPage === pageNum;
                // Simple logic to show only nearby pages if there are many
                if (totalPages > 7 && (pageNum > 1 && pageNum < totalPages && Math.abs(pageNum - currentPage) > 2)) {
                   if (pageNum === 2 || pageNum === totalPages - 1) return <div key={pageNum} className="w-[40px] h-[40px] flex items-center justify-center text-[#667085]">...</div>
                   return null;
                }
                return (
                  <div 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-[40px] h-[40px] rounded-[8px] flex items-center justify-center text-[14px] cursor-pointer font-medium transition-all ${
                      isActive ? 'bg-[#f9f5ff] text-[#7f56d9]' : 'text-[#667085] hover:bg-gray-50'
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
              className={`h-[40px] px-[14px] border border-[#d0d5dd] rounded-[8px] bg-white font-medium text-[14px] text-[#344054] cursor-pointer flex items-center gap-[8px] hover:bg-gray-50 transition-all shadow-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next <img src="/assets/arrow-right.svg" className="w-[16px] h-[16px]" alt="" />
            </button>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      {isModalVisible && appToApprove && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
          onClick={() => setIsModalVisible(false)}
        >
          <div
            className="bg-white rounded-[16px] p-[28px] w-full max-w-[420px] shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-[52px] h-[52px] rounded-[12px] bg-[#ecfdf3] flex items-center justify-center mb-[16px] border border-[#abefc6]">
                <CheckCircleOutlined className="text-[#067647] text-[24px]" />
              </div>

              <h3 className="text-[18px] font-semibold text-[#101828] text-center mb-[8px]">
                Accept {appToApprove.postulant?.user?.user_name || 'this candidate'}?
              </h3>

              <p className="text-[14px] text-[#667085] text-center leading-relaxed mb-[24px]">
                By approving this candidature, the candidate will be accepted for the role of <b>{appToApprove.job?.title || 'Postulant'}</b>.
              </p>

              <div className="flex gap-[12px] w-full">
                <button
                  onClick={() => setIsModalVisible(false)}
                  className="flex-1 h-[44px] border border-[#d0d5dd] rounded-[8px] bg-white text-[#344054] font-semibold text-[14px] hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsModalVisible(false)
                    setIsHiringModal(true)
                  }}
                  className="flex-1 h-[44px] bg-[#7f56d9] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#6941c6] transition-all shadow-sm"
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
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
          onClick={() => setIsDeleteModalVisible(false)}
        >
          <div
            className="bg-white rounded-[16px] p-[28px] w-full max-w-[420px] shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-[52px] h-[52px] rounded-[12px] bg-[#fef3f2] flex items-center justify-center mb-[16px] border border-[#fecdca]">
                <CloseCircleOutlined className="text-[#d92d20] text-[24px]" />
              </div>

              <h3 className="text-[18px] font-semibold text-[#101828] text-center mb-[8px]">
                Reject {appToDelete.postulant?.user?.user_name || 'this candidate'}?
              </h3>

              <p className="text-[14px] text-[#667085] text-center leading-relaxed mb-[24px]">
                 Their other applications will remain active.
              </p>

              <div className="flex gap-[12px] w-full">
                <button
                  onClick={() => setIsDeleteModalVisible(false)}
                  className="flex-1 h-[44px] border border-[#d0d5dd] rounded-[8px] bg-white text-[#344054] font-semibold text-[14px] hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(appToDelete, 'rejected')}
                  className="flex-1 h-[44px] bg-[#d92d20] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#b42318] transition-all shadow-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {isPermDeleteModalVisible && selectedIds.size > 0 && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1001] p-4"
          onClick={() => setIsPermDeleteModalVisible(false)}
        >
          <div
            className="bg-white rounded-[16px] p-[28px] w-full max-w-[420px] shadow-2xl animate-in fade-in zoom-in duration-200 border-2 border-[#FDA29B]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-[52px] h-[52px] rounded-[12px] bg-[#FEF2F2] flex items-center justify-center mb-[16px] shadow-sm">
                <CloseCircleOutlined className="text-[#DC2626] text-[24px]" />
              </div>

              <h3 className="text-[18px] font-semibold text-[#101828] text-center mb-[4px]">
                Archive {selectedIds.size} registration{selectedIds.size > 1 ? 's' : ''}?
              </h3>

              <p className="text-[14px] text-[#667085] text-center leading-relaxed mb-[24px]">
                This will move the selected registrations to the archive. They can be restored later.
              </p>

              <div className="flex gap-[12px] w-full">
                <button
                  onClick={() => setIsPermDeleteModalVisible(false)}
                  className="flex-1 h-[44px] border border-[#d0d5dd] rounded-[8px] bg-white text-[#344054] font-semibold text-[14px] hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveSelected}
                  className="flex-1 h-[44px] bg-[#7f56d9] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#6941c6] transition-all shadow-sm flex items-center justify-center gap-[8px]"
                >
                  Archive
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
              // @ts-expect-error dayjs type
              value={hiringData.hire_date}
              onChange={(date) => setHiringData({...hiringData, hire_date: date as any})}
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
              onChange={(val) => setHiringData({...hiringData, department: val})}
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
            <label className="text-[14px] font-semibold text-[#344054]">Rate per month (TND)</label>
            <Select
              className="w-full h-[48px] rounded-lg border-[#D0D5DD]"
              placeholder="Select monthly rate..."
              suffixIcon={<DollarOutlined className="text-gray-400" />}
              value={hiringData.monthly_rate}
              onChange={(val) => setHiringData({...hiringData, monthly_rate: val})}
              options={[
                { value: 800, label: '800 TND' },
                { value: 1000, label: '1,000 TND' },
                { value: 1200, label: '1,200 TND' },
                { value: 1500, label: '1,500 TND' },
                { value: 2000, label: '2,000 TND' },
                { value: 2500, label: '2,500 TND' },
                { value: 3000, label: '3,000 TND' },
                { value: 4000, label: '4,000 TND' },
                { value: 5000, label: '5,000 TND' },
              ]}
            />
            <p className="text-[12px] text-[#667085]">Select the agreed gross monthly salary in TND.</p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              onClick={() => setIsHiringModal(false)}
              className="px-6 py-[10px] rounded-lg border border-[#D0D5DD] font-semibold text-[#344054] hover:bg-gray-50 bg-white shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleHiringDone}
              className="px-8 py-[10px] rounded-lg bg-[#7f56d9] text-white font-semibold hover:bg-[#6941c6] shadow-sm transition-all"
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
