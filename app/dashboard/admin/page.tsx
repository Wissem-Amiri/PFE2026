'use client'

import { useEffect, useState } from 'react'
import { getAllUsers } from '@/lib/profileService'
import type { Utilisateur } from '@/lib/database.types'

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllUsers().then(({ data }) => {
      setUsers(data ?? [])
      setLoading(false)
    })
  }, [])

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <div className="flex min-h-screen">
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 p-[24px] px-[28px]">
        <div className="flex justify-between items-center mb-[20px]">
          <h1 className="text-[22px] font-bold text-[#101828] mb-0">Home</h1>
          <span className="text-[16px] color-[#98A2B3] cursor-pointer">🔍</span>
        </div>

        <div className="grid grid-cols-3 gap-[12px] mb-[24px]">
          <div className="bg-white border border-[#E4E7EC] rounded-[12px] p-[16px]">
            <h4 className="text-[11px] text-[#475467] font-medium mb-[6px] flex justify-between">Registration requests <span>⋯</span></h4>
            <div className="text-[28px] font-bold text-[#101828]">{loading ? '-' : pendingCount}</div>
          </div>
          <div className="bg-white border border-[#E4E7EC] rounded-[12px] p-[16px]">
            <h4 className="text-[11px] text-[#475467] font-medium mb-[6px] flex justify-between">Leave requests <span>⋯</span></h4>
            <div className="text-[28px] font-bold text-[#101828]">0</div>
          </div>
          <div className="bg-white border border-[#E4E7EC] rounded-[12px] p-[16px]">
            <h4 className="text-[11px] text-[#475467] font-medium mb-[6px] flex justify-between">Job submissions <span>⋯</span></h4>
            <div className="text-[28px] font-bold text-[#101828]">0</div>
          </div>
        </div>

        <div className="bg-white border border-[#E4E7EC] rounded-[12px] overflow-hidden">
          <div className="px-[18px] py-[14px] border-b border-[#E4E7EC] flex justify-between items-center">
            <div><h3 className="text-[13px] font-semibold text-[#101828] m-0">Recent activity</h3></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Submission Date ↓</th>
                  <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Date</th>
                  <th className="px-[16px] py-[9px] text-left text-[11px] text-[#98A2B3] font-medium border-b border-[#E4E7EC] whitespace-nowrap">Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map(u => (
                  <tr key={u.id}>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-[#9CA3AF] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                          {u.user_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                        <div className="text-[12px] font-semibold text-[#101828]">{u.user_name || '—'}</div>
                      </div>
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      {new Date(u.created_at || '').toLocaleDateString('en-US')}
                    </td>
                    <td className="px-[16px] py-[10px] text-[12px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                      <span className="px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#D97706]">New Registration</span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                   <tr>
                     <td colSpan={4} className="text-center py-8 text-sm text-gray-400">No recent activity found.</td>
                   </tr>
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

      {/* ── RIGHT PANEL ── */}
      <div className="w-[240px] bg-[#F9FAFB] border-l border-[#E4E7EC] p-[20px]">
        <div className="text-center">
          <div className="w-[80px] h-[80px] rounded-full mx-auto mb-[10px] overflow-hidden bg-[#EDE9FE] flex items-center justify-center text-[28px] font-bold text-[#7C3AED]">
            AD
          </div>
          <div className="text-[14px] font-bold text-[#101828]">Admin</div>
          <div className="text-[11px] text-[#475467] mb-[14px]">Admin</div>
          <div className="flex gap-[6px] justify-center mb-[16px]">
            <button className="px-[14px] py-[6px] rounded-[7px] font-['Sora',sans-serif] text-[11px] font-medium cursor-pointer border-[1.5px] border-[#D0D5DD] bg-white text-[#101828] hover:border-[#7c3aed]">Settings</button>
            <button className="px-[14px] py-[6px] rounded-[7px] font-['Sora',sans-serif] text-[11px] font-medium cursor-pointer border-[1.5px] border-[#7C3AED] bg-[#7C3AED] text-white hover:bg-[#6D28D9]">View profile</button>
          </div>
        </div>
      </div>
    </div>
  )
}
