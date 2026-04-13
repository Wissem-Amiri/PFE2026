'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, message, Modal, Tooltip, Breadcrumb } from 'antd'
import { 
  ArrowLeftOutlined, 
  ReloadOutlined, 
  SearchOutlined, 
  DeleteOutlined,
  FolderOpenOutlined 
} from '@ant-design/icons'
import { getArchivedCandidaturesDetailed, restoreCandidatures } from '@/lib/candidatureService'

export default function ArchiveRegistrationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isRestoreModalVisible, setIsRestoreModalVisible] = useState(false)

  const router = useRouter()

  const fetchApplications = async () => {
    setLoading(true)
    const { data } = await getArchivedCandidaturesDetailed()
    setApplications(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchApplications() }, [])

  const handleRestoreSelected = async () => {
    const ids = Array.from(selectedIds)
    const { error } = await restoreCandidatures(ids)
    if (!error) {
      setIsRestoreModalVisible(false)
      setSelectedIds(new Set())
      message.success(`${ids.length} registration(s) restored successfully`)
      fetchApplications()
    } else {
      message.error('Failed to restore registrations')
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

  const filtered = applications.filter(app => {
    const u = app.user
    const j = app.job
    const matchSearch =
      (u?.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (j?.title ?? '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto">
      <div className="mb-[20px]">
        <Breadcrumb 
          items={[
            { title: <a onClick={() => router.push('/dashboard/admin/registrations')}>Registrations</a> },
            { title: 'Archive' },
          ]} 
          className="mb-2"
        />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard/admin/registrations')}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-all"
            >
              <ArrowLeftOutlined />
            </button>
            <h1 className="text-[22px] font-bold text-[#101828] mb-0">Archived Registrations</h1>
          </div>
          <div className="flex gap-[8px] items-center">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setIsRestoreModalVisible(true)}
                className="px-[14px] py-[7px] border-[1.5px] border-[#12B76A] rounded-[8px] bg-[#ECFDF3] font-['Sora',sans-serif] text-[12px] font-semibold text-[#027A48] cursor-pointer flex items-center gap-[6px] hover:bg-[#D1FADF] transition-all"
              >
                <ReloadOutlined /> Restore {selectedIds.size}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E4E7EC] rounded-[12px] overflow-hidden shadow-sm">
        <div className="px-[18px] py-[14px] border-b border-[#E4E7EC] flex justify-between items-center bg-[#F9FAFB]">
          <div>
            <h3 className="text-[14px] font-bold text-[#101828] mb-0 mt-0">Archive List</h3>
            <p className="text-[12px] text-[#475467] mt-[2px] mb-0 font-medium">History of processed or archived registrations.</p>
          </div>
          <div className="flex items-center gap-[8px] px-[12px] py-[7px] border-[1.5px] border-[#D0D5DD] rounded-[8px] text-[12px] text-[#475467] bg-white focus-within:border-[#7c3aed]">
            <SearchOutlined />
            <input
              placeholder="Search in archive"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-none outline-none font-medium text-[12px] text-[#101828] bg-transparent w-[200px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-[16px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">
                  <input
                    type="checkbox"
                    className="rounded cursor-pointer"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-[16px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Name</th>
                <th className="px-[16px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Job Title</th>
                <th className="px-[16px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Status</th>
                <th className="px-[16px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Archived At</th>
                <th className="px-[16px] py-[12px] text-left text-[11px] text-[#475467] font-bold uppercase tracking-wider border-b border-[#E4E7EC] bg-[#F9FAFB]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium animate-pulse">Loading archive...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                       <FolderOpenOutlined className="text-[32px] text-slate-200" />
                       <span className="text-slate-400 font-medium">No archived registrations found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-[16px] py-[12px] border-b border-[#F2F4F7] align-middle">
                      <input
                        type="checkbox"
                        className="rounded cursor-pointer"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelectRow(app.id)}
                      />
                    </td>
                    <td className="px-[16px] py-[12px] border-b border-[#F2F4F7] align-middle">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0 border border-slate-200">
                          {app.user?.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-[#101828]">{app.user?.user_name || '—'}</div>
                          <div className="text-[11px] text-slate-500">{app.user?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-[16px] py-[12px] border-b border-[#F2F4F7] align-middle text-[12px] font-semibold text-slate-700">
                      {app.job?.title || 'Unknown Position'}
                    </td>
                    <td className="px-[16px] py-[12px] border-b border-[#F2F4F7] align-middle">
                      {app.status === 'accepted' ? (
                        <Tag color="green" className="rounded-full px-3 font-bold uppercase text-[10px]">Accepted</Tag>
                      ) : (
                        <Tag color="default" className="rounded-full px-3 font-bold uppercase text-[10px]">{app.status}</Tag>
                      )}
                    </td>
                    <td className="px-[16px] py-[12px] border-b border-[#F2F4F7] align-middle text-[12px] text-slate-500 font-medium">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-[16px] py-[12px] border-b border-[#F2F4F7] align-middle">
                      <Tooltip title="Restore Registration">
                        <button 
                          onClick={() => {
                            setSelectedIds(new Set([app.id]))
                            setIsRestoreModalVisible(true)
                          }}
                          className="w-[32px] h-[32px] rounded-[8px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[#12B76A] hover:bg-[#ECFDF3] hover:border-[#12B76A] transition-all"
                        >
                          <ReloadOutlined className="text-[14px]" />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        title="Restore Registrations"
        open={isRestoreModalVisible}
        onCancel={() => setIsRestoreModalVisible(false)}
        centered
        footer={[
          <button 
            key="cancel" 
            onClick={() => setIsRestoreModalVisible(false)}
            className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold mr-3 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>,
          <button 
            key="ok" 
            onClick={handleRestoreSelected}
            className="px-8 py-2 rounded-lg bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] transition-all shadow-md"
          >
            Yes, Restore
          </button>
        ]}
      >
        <p className="py-4 text-slate-600 font-medium">Are you sure you want to restore these registrations to the active list?</p>
      </Modal>
    </div>
  )
}
