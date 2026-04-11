'use client'

import { useEffect, useState } from 'react'
import { getAllUsers, updateUserStatus, exportToCSV, downloadCSV } from '@/lib/profileService'
import type { Utilisateur } from '@/lib/database.types'

export default function RegistrationsPage() {
  const [users, setUsers] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await getAllUsers()
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAction = async (userId: string, status: 'approved' | 'rejected') => {
    const { error } = await updateUserStatus(userId, status)
    if (!error) {
      fetchUsers()
    }
  }

  const handleExport = () => {
    const csv = exportToCSV(filtered)
    downloadCSV(csv, 'registrations.csv')
  }

  const filtered = users.filter(u => {
    const matchSearch =
      (u.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="text-[22px] font-bold text-[#101828] mb-0">Registrations</h1>
        <div className="flex gap-[8px] items-center">
          <button className="px-[14px] py-[7px] border-[1.5px] border-[#D0D5DD] rounded-[8px] bg-white font-['Sora',sans-serif] text-[12px] font-medium text-[#475467] cursor-pointer flex items-center gap-[6px] hover:border-[#7c3aed] hover:text-[#7c3aed]">
            🔍
          </button>
          <button onClick={handleExport} className="px-[14px] py-[7px] border-[1.5px] border-[#D0D5DD] rounded-[8px] bg-white font-['Sora',sans-serif] text-[12px] font-medium text-[#475467] cursor-pointer flex items-center gap-[6px] hover:border-[#7c3aed] hover:text-[#7c3aed]">
            ⬆ Export
          </button>
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
                <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap"><input type="checkbox" className="rounded" /></th>
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
                filtered.map((u, i) => (
                  <tr key={u.id}>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-[#EDE9FE] flex items-center justify-center text-[11px] font-bold text-[#7C3AED] shrink-0">
                          {u.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-[#101828]">{u.user_name || '—'}</div>
                          <div className="text-[11px] text-[#475467]">{u.department || 'Postulant'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle flex items-center h-full">
                      {u.email}
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      {new Date(u.created_at || '').toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      {u.status === 'pending' && <span className="px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#D97706]">Pending</span>}
                      {u.status === 'approved' && <span className="px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A]">Approved</span>}
                      {u.status === 'rejected' && <span className="px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626]">Rejected</span>}
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <div className="flex gap-[6px] items-center">
                        <button className="w-[28px] h-[28px] rounded-[6px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[13px] hover:border-[#7c3aed]">
                          👁
                        </button>
                        {u.status === 'pending' && (
                          <>
                            <button onClick={() => handleAction(u.id, 'approved')} className="w-[28px] h-[28px] rounded-[6px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[13px] hover:border-[#12B76A] hover:text-[#12B76A]">
                              ✓
                            </button>
                            <button onClick={() => handleAction(u.id, 'rejected')} className="w-[28px] h-[28px] rounded-[6px] border border-[#D0D5DD] bg-white flex items-center justify-center cursor-pointer text-[13px] hover:border-[#F04438] hover:text-[#F04438]">
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
    </div>
  )
}
