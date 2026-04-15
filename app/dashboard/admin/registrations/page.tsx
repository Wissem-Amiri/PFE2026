'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, message, Modal, DatePicker, Select, Input } from 'antd'
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
import { getAllUsers, updateUserStatus as updateGlobalUserStatus, exportToCSV, downloadCSV } from '@/lib/profileService'
import { getAllCandidaturesDetailed, updateCandidatureStatus, archiveCandidatures, deleteAllOtherCandidatures } from '@/lib/candidatureService'
import type { FullProfile } from '@/lib/database.types'

export default function RegistrationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
    // 1. Update the specific candidature status
    const { error: appError } = await updateCandidatureStatus(application.id, status)

    if (!appError) {
      // 2. If approving, also ensure the user becomes an employee (global role)
      if (status === 'accepted') {
        const { error: statusError } = await updateGlobalUserStatus(application.postulant_id, 'approved', hiringDetails)
        
        if (!statusError) {
          // 3. Cleanup: Delete all other candidatures for this user permanently
          await deleteAllOtherCandidatures(application.postulant_id, application.id)
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
    // Note: Exporting users from applications list
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

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="text-[22px] font-bold text-[#101828] mb-0">Registrations</h1>
        <div className="flex gap-[8px] items-center">
          <button 
            onClick={() => router.push('/dashboard/admin/registrations/archive')}
            className="px-[14px] py-[7px] border-[1.5px] border-[#D0D5DD] rounded-[8px] bg-white font-['Sora',sans-serif] text-[12px] font-medium text-[#475467] cursor-pointer flex items-center gap-[8px] hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
          >
            <FolderOpenOutlined className="text-[14px]" />
            Archive
          </button>
          
          <button onClick={handleExport} className="px-[14px] py-[7px] border-[1.5px] border-[#D0D5DD] rounded-[8px] bg-white font-['Sora',sans-serif] text-[12px] font-medium text-[#475467] cursor-pointer flex items-center gap-[6px] hover:border-[#7c3aed] hover:text-[#7c3aed]">
            <DownloadOutlined /> Export
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsPermDeleteModalVisible(true)}
              className="px-[14px] py-[7px] border-[1.5px] border-[#7c3aed] rounded-[8px] bg-[#F5F3FF] font-['Sora',sans-serif] text-[12px] font-semibold text-[#7c3aed] cursor-pointer flex items-center gap-[6px] hover:bg-[#EDE9FE] transition-colors animate-in fade-in slide-in-from-right-2"
            >
              📂 Archive {selectedIds.size}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E4E7EC] rounded-[12px] overflow-hidden">
        <div className="px-[18px] py-[14px] border-b border-[#E4E7EC] flex justify-between items-center">
          <div>
            <h3 className="text-[13px] font-semibold text-[#101828] mb-0 mt-0">Latest Registrations</h3>
            <p className="text-[11px] text-[#475467] mt-[2px] mb-0">Keep track of registrations and their status.</p>
          </div>
          <div className="flex items-center gap-[8px] px-[12px] py-[7px] border-[1.5px] border-[#D0D5DD] rounded-[8px] text-[12px] text-[#475467] bg-white focus-within:border-[#7c3aed]">
            🔍 <input
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-none outline-none font-['Sora',sans-serif] text-[12px] text-[#101828] bg-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded cursor-pointer"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Name</th>
                <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Email address</th>
                <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Submission Date</th>
                <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Status</th>
                <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">No registrations found.</td></tr>
              ) : (
                filtered.map((app, i) => (
                  <tr key={app.id}>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <input
                        type="checkbox"
                        className="rounded cursor-pointer"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelectRow(app.id)}
                      />
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-[#EDE9FE] flex items-center justify-center text-[11px] font-bold text-[#7C3AED] shrink-0">
                          {app.postulant?.user?.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-[#101828]">{app.postulant?.user?.user_name || '—'}</div>
                          <div className="text-[11px] text-[#7C3AED] font-medium">{app.job?.title || 'Postulant'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      {app.postulant?.user?.email || '—'}
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      {new Date(app.applied_at || app.created_at || '').toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      {app.status === 'pending' && <span className="px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#D97706]">Pending</span>}
                      {app.status === 'accepted' && <span className="px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A]">Approved</span>}
                      {app.status === 'rejected' && <span className="px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626]">Rejected</span>}
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <div className="flex gap-[6px] items-center">
                        <button onClick={() => router.push(`/dashboard/admin/registrations/${app.postulant_id}?jobId=${app.job_id}`)} className="w-[28px] h-[28px] rounded-[6px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[13px] hover:border-[#7c3aed]">
                          👁
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setAppToApprove(app)
                                setIsModalVisible(true)
                              }}
                              className="w-[28px] h-[28px] rounded-[6px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[13px] hover:border-[#12B76A] hover:text-[#12B76A]"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setAppToDelete(app)
                                setIsDeleteModalVisible(true)
                              }}
                              className="w-[28px] h-[28px] rounded-[6px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[13px] hover:border-[#F04438] hover:text-[#F04438]"
                            >
                              ✕
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

        <div className="flex items-center justify-between px-[18px] py-[12px] border-t border-[#E4E7EC]">
          <button className="px-[12px] py-[6px] border-[1.5px] border-[#D0D5DD] rounded-[6px] bg-white font-['Sora',sans-serif] text-[11px] font-medium cursor-pointer flex items-center gap-[4px] hover:border-[#7c3aed]">← Previous</button>
          <div className="flex gap-[4px] items-center">
            <div className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[11px] cursor-pointer font-medium bg-[#EDE9FE] text-[#7C3AED]">1</div>
            <div className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[11px] cursor-pointer font-medium hover:bg-gray-50">2</div>
            <div className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[11px] cursor-pointer font-medium hover:bg-gray-50">3</div>
            <div className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[11px] cursor-pointer font-medium">…</div>
            <div className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[11px] cursor-pointer font-medium hover:bg-gray-50">10</div>
          </div>
          <button className="px-[12px] py-[6px] border-[1.5px] border-[#D0D5DD] rounded-[6px] bg-white font-['Sora',sans-serif] text-[11px] font-medium cursor-pointer flex items-center gap-[4px] hover:border-[#7c3aed]">Next →</button>
        </div>
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
              <div className="w-[52px] h-[52px] rounded-[12px] bg-[#DCFCE7] flex items-center justify-center mb-[16px]">
                <CheckCircleOutlined className="text-[#16A34A] text-[24px]" />
              </div>

              <h3 className="text-[16px] font-bold text-[#101828] text-center mb-[4px]">
                Accept {appToApprove.postulant?.user?.user_name || 'this candidate'} for {appToApprove.job?.title || 'this position'}?
              </h3>

              <p className="text-[13px] text-[#475467] text-center leading-[1.6] mb-[20px]">
                By approving this candidature, the candidate will be accepted for this specific role.
                They will also be promoted to the Employee role if not already done.
              </p>

              <div className="flex gap-[10px] w-full">
                <button
                  onClick={() => setIsModalVisible(false)}
                  className="flex-1 h-[40px] border-[1.5px] border-[#D0D5DD] rounded-[8px] bg-white text-[#344054] font-medium text-[13px] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsModalVisible(false)
                    setIsHiringModal(true)
                  }}
                  className="flex-1 h-[40px] bg-[#7C3AED] text-white rounded-[8px] font-semibold text-[13px] hover:bg-[#6D28D9] transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal (Delete) */}
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
              <div className="w-[52px] h-[52px] rounded-[12px] bg-[#FEF2F2] flex items-center justify-center mb-[16px]">
                <CloseCircleOutlined className="text-[#DC2626] text-[24px]" />
              </div>

              <h3 className="text-[16px] font-bold text-[#101828] text-center mb-[4px]">
                Reject {appToDelete.postulant?.user?.user_name || 'this candidate'} for {appToDelete.job?.title || 'this position'}?
              </h3>

              <p className="text-[13px] text-[#475467] text-center leading-[1.6] mb-[20px]">
                By rejecting this candidature, the candidate will be notified of the decision for this specific job.
                Their other applications will remain active.
              </p>

              <div className="flex gap-[10px] w-full">
                <button
                  onClick={() => setIsDeleteModalVisible(false)}
                  className="flex-1 h-[40px] border-[1.5px] border-[#D0D5DD] rounded-[8px] bg-white text-[#344054] font-medium text-[13px] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(appToDelete, 'rejected')}
                  className="flex-1 h-[40px] bg-[#DC2626] text-white rounded-[8px] font-semibold text-[13px] hover:bg-[#B91C1C] transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal (NEW) */}
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

              <h3 className="text-[16px] font-bold text-[#101828] text-center mb-[4px]">
                Supprimer {selectedIds.size} inscription{selectedIds.size > 1 ? 's' : ''} ?
              </h3>

              <p className="text-[13px] text-[#475467] text-center leading-[1.6] mb-[24px]">
                Attention : Cette action supprimera <b>définitivement</b> les comptes sélectionnés de la base de données. Les candidats concernés ne pourront plus se connecter.
              </p>

              <div className="flex gap-[12px] w-full">
                <button
                  onClick={() => setIsPermDeleteModalVisible(false)}
                  className="flex-1 h-[44px] border border-[#D0D5DD] rounded-[10px] bg-white text-[#344054] font-semibold text-[14px] hover:bg-gray-50 transition-all shadow-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleArchiveSelected}
                  className="flex-1 h-[44px] bg-[#7c3aed] text-white rounded-[10px] font-semibold text-[14px] hover:bg-[#6d28d9] transition-all shadow-sm flex items-center justify-center gap-[8px]"
                >
                  Archiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hiring Details Modal (Image 3 style) */}
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
          {/* Hiring Date */}
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

          {/* Department */}
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

          {/* Rate per month */}
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              onClick={() => setIsHiringModal(false)}
              className="px-6 py-[10px] rounded-lg border border-[#D0D5DD] font-semibold text-[#344054] hover:bg-gray-50 bg-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleHiringDone}
              className="px-8 py-[10px] rounded-lg bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9]"
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
          border-bottom: 1px solid #F2F4F7;
          margin-bottom: 0;
          padding: 20px 24px;
        }
        .hiring-modal .ant-modal-body {
          padding: 24px;
        }
        .hiring-modal .ant-select-selector {
          height: 44px !important;
          border-radius: 8px !important;
          display: flex !important;
          align-items: center !important;
          border-color: #D0D5DD !important;
        }
        .hiring-modal .ant-picker {
          height: 44px !important;
          border-radius: 8px !important;
          border-color: #D0D5DD !important;
          width: 100%;
        }
      `}</style>
    </div>

  )
}
