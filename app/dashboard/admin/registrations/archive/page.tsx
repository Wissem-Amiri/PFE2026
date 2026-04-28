'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { message, Modal, DatePicker, Select, Input } from 'antd'
import dayjs from 'dayjs'
import {
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCalendar,
  HiOutlineTrash,
  HiOutlineDownload,
  HiOutlineArchive,
  HiOutlineRefresh,
  HiOutlineArrowLeft
} from 'react-icons/hi'
import { restoreCandidatures, hardDeleteCandidatures } from '@/api/candidatures'
import { useCandidatures, queryKeys } from '@/api/hooks'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

export default function RegistrationsArchivePage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const pageSize = 10

  const { data: result, isLoading: loading } = useCandidatures({
    page: currentPage,
    pageSize,
    showArchived: true, // Always true for this page
    status: statusFilter,
    startDate: dateRange?.[0]?.toISOString(),
    endDate: dateRange?.[1]?.toISOString(),
    search: search
  })

  const applications = result?.data || []
  const totalItems = result?.count || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleRestoreSelected = async () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    try {
      const { error } = await restoreCandidatures(ids)
      if (error) throw error
      message.success(`${ids.length} registration(s) restored successfully`)
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: queryKeys.candidatures })
    } catch (error: any) {
      message.error(error.message || 'Failed to restore registrations')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    
    Modal.confirm({
      title: 'Delete Permanently?',
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
    if (selectedIds.size === applications.length && applications.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(applications.map(u => u.id)))
    }
  }

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, dateRange])

  return (
    <div className="flex-1 bg-[#f8fafc] flex flex-col font-['Inter',sans-serif]">
      {/* ── HEADER ── */}
      <div className="bg-white px-[27px] py-[24px] border-b border-[#e2e8f0] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/registrations" className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500 hover:text-gray-900">
            <HiOutlineArrowLeft size={24} />
          </Link>
          <h1 className="text-[20px] font-bold text-[#0f172a]">Archived Registrations</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] pb-[32px]">
        {/* ── DESCRIPTION ── */}
        <div className="mt-[32px] mb-[16px]">
          <p className="text-[14px] text-[#64748b] leading-[20px]">
            Review and manage registrations that have been moved to the archive.
          </p>
        </div>

        {/* ── SEARCH & FILTERS BAR ── */}
        <div className="bg-[rgba(248,248,248,0.31)] border border-[rgba(203,195,213,0.1)] rounded-[16px] h-[76px] px-[16px] mb-[16px] flex items-center justify-between">
          <div className="flex-1 max-w-[550px] relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[15px] h-[15px]">
              <HiOutlineSearch className="text-gray-400 text-lg" />
            </div>
            <input 
              placeholder="Search archived registrations..."
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
                className="w-full !h-[44px] !rounded-[12px]"
                options={[
                  { value: 'All Status', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── SELECTION BAR ── */}
        {selectedIds.size > 0 && (
          <div className="mx-[16px] mb-[16px] p-[12px] bg-[#F5F3FF] border border-[#DDD6FE] rounded-[12px] flex justify-between items-center">
            <div className="flex items-center gap-[12px]">
              <span className="text-[14px] font-semibold text-[#7C3AED]">{selectedIds.size} archived registration(s) selected</span>
              <button 
                onClick={toggleSelectAll}
                className="text-[14px] font-semibold text-[#7F56D9] bg-transparent border-0 cursor-pointer hover:underline"
              >
                {selectedIds.size === applications.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-[8px]">
              <button 
                onClick={handleRestoreSelected}
                className="h-[40px] px-[16px] rounded-[8px] border border-[#DDD6FE] bg-white text-[#7C3AED] font-semibold flex items-center gap-[8px] hover:bg-[#F5F3FF] transition-all shadow-sm"
              >
                <HiOutlineRefresh className="text-[18px]" />
                Restore Selected
              </button>
              <button 
                onClick={handleDeleteSelected}
                className="h-[40px] px-[16px] rounded-[8px] border border-[#FDA29B] bg-[#FEF3F2] text-[#B42318] font-semibold flex items-center gap-[8px] hover:bg-[#FEE4E2] transition-all shadow-sm"
              >
                <HiOutlineTrash className="text-[18px]" />
                Delete Permanently
              </button>
            </div>
          </div>
        )}

        {/* ── DATA TABLE CARD ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[rgba(248,250,252,0.5)]">
                <th className="px-[23px] py-[15px] w-[64px] border-b border-[#f1f5f9]">
                  <input
                    type="checkbox"
                    checked={applications.length > 0 && selectedIds.size === applications.length}
                    onChange={toggleSelectAll}
                    className="w-[16px] h-[16px] rounded-[4px] border-[#cbd5e1] checked:accent-[#7f56d9]"
                  />
                </th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">NAME</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">EMAIL</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">SUBMISSION DATE</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase">STATUS</th>
                <th className="px-[24px] py-[16px] border-b border-[#f1f5f9] text-[12px] font-semibold text-[#64748b] tracking-[0.6px] uppercase text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-[60px] text-[#64748b]">Loading archive...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-[60px] text-[#64748b]">No archived registrations found.</td></tr>
              ) : (
                applications.map((app) => (
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
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-[#0f172a]">{app.candidat?.user?.user_name || 'Anonymous'}</span>
                          <span className="text-[12px] text-[#64748b]">{app.job?.title || 'Candidate'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-[24px] py-[26px] text-[14px] text-[#475569]">{app.candidat?.user?.email || '—'}</td>
                    <td className="px-[24px] py-[26px] text-[14px] text-[#475569]">
                      {dayjs(app.applied_at || app.created_at).format('DD/MM/YYYY HH:mm')}
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
                          <div className="w-[32px]" />
                          <button
                            onClick={() => router.push(`/dashboard/admin/registrations/${app.candidat_id}?jobId=${app.job_id}`)}
                            className="w-[32px] h-[32px] rounded-[6px] text-[#7f56d9] hover:bg-[#f9f5ff] transition-all flex items-center justify-center"
                            title="View Details"
                          >
                            <HiOutlineEye size={20} />
                          </button>
                          <div className="w-[32px]" />
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
                className="flex items-center gap-2 px-3 py-2 border border-[#d0d5dd] rounded-[8px] text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <HiOutlineChevronLeft /> Previous
              </button>
              
              <span className="text-[14px] text-[#64748b]">Page {currentPage} of {totalPages}</span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-3 py-2 border border-[#d0d5dd] rounded-[8px] text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Next <HiOutlineChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
