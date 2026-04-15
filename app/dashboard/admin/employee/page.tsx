'use client'

import { useEffect, useState } from 'react'
import { SearchOutlined, TeamOutlined, MailOutlined, BankOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Input, Avatar, Card, Tag, Spin, Button } from 'antd'
import { getAllUsers } from '@/lib/profileService'
import type { FullProfile } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

export default function AdminEmployeeListPage() {
  const [employees, setEmployees] = useState<FullProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true)
      const { data } = await getAllUsers()
      // Filter to only show approved employees
      const employeeList = (data ?? []).filter(u => u.role === 'employee' && u.status === 'approved')
      setEmployees(employeeList)
      setLoading(false)
    }
    fetchEmployees()
  }, [])

  const filtered = employees.filter(e =>
    (e.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.employee?.department ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.employee?.position ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-[32px] px-[40px] bg-[#fcfcfd] min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <div className="flex items-center gap-2 text-[#667085] mb-2 cursor-pointer hover:text-[#7c3aed] transition-colors" onClick={() => router.push('/dashboard/admin')}>
              <ArrowLeftOutlined className="text-xs" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Back to Dashboard</span>
           </div>
           <h1 className="text-[26px] font-black text-[#101828] tracking-tight leading-none text-left">Active Employees</h1>
           <p className="text-[14px] text-[#667085] font-medium mt-2 text-left">Manage and view all registered team members.</p>
        </div>

        <div className="flex items-center gap-[12px] px-[14px] py-[10px] border border-[#eaecf0] rounded-[12px] bg-white shadow-sm w-[360px] focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <SearchOutlined className="text-[#667085]" />
          <input 
            placeholder="Search by name, position or department..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-none outline-none text-[14px] font-medium w-full text-[#101828] placeholder:text-[#98a2b3]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Spin size="large" className="mb-4" />
          <span className="font-bold text-[14px] uppercase tracking-widest">Gathering team data...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] py-24 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#f9fafb] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#f2f4f7]">
             <TeamOutlined className="text-2xl text-[#d0d5dd]" />
          </div>
          <p className="text-[#101828] font-bold text-lg mb-1">No employees found</p>
          <p className="text-[#667085] text-sm">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-sm hover:shadow-xl hover:border-[#7c3aed] transition-all group flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                 <Tag className="m-0 rounded-full border-none bg-[#F5F3FF] text-[#7C3AED] font-bold text-[10px] uppercase px-2">Active</Tag>
              </div>

              <div className="relative mb-5 mt-2">
                <Avatar
                  size={90}
                  src={emp.avatar_url ?? undefined}
                  icon={<UserOutlined />}
                  className="bg-[#f5f3ff] text-[#7c3aed] border-[4px] border-white shadow-md ring-1 ring-slate-100"
                />
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-[3px] border-white rounded-full"></div>
              </div>

              <h3 className="text-[17px] font-black text-[#101828] mb-1 truncate w-full px-2" title={emp.user_name ?? ''}>
                {emp.user_name || 'Anonymous'}
              </h3>
              <p className="text-[#667085] text-[13px] font-bold mb-4 uppercase tracking-widest">
                {emp.employee?.position || 'Team Member'}
              </p>

              <div className="grid grid-cols-1 gap-3 w-full mt-auto pt-5 border-t border-[#f2f4f7]">
                <div className="flex items-center justify-center gap-2.5 text-[12px] text-[#475467] font-medium">
                  <BankOutlined className="text-[#98A2B3]" />
                  <span>{emp.employee?.department || 'General'}</span>
                </div>
                <div className="flex items-center justify-center gap-2.5 text-[12px] text-[#475467] font-medium">
                  <MailOutlined className="text-[#98A2B3]" />
                  <span className="truncate max-w-[180px]" title={emp.email ?? ''}>{emp.email}</span>
                </div>
              </div>

              <Button 
                block 
                className="mt-6 h-[40px] rounded-xl border-[#eaecf0] font-bold text-[13px] text-[#344054] hover:text-[#7c3aed] hover:border-[#7c3aed] hover:bg-[#f5f3ff]"
              >
                View full profile
              </Button>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        input::placeholder {
          color: #98a2b3 !important;
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
