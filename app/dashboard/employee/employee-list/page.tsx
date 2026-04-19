'use client'

import { useEffect, useState } from 'react'
import { SearchOutlined, TeamOutlined, MailOutlined, BankOutlined, UserOutlined } from '@ant-design/icons'
import { Input, Avatar, Card, Tag, Spin } from 'antd'
import { getAllUsers } from '@/api/profile'
import type { Utilisateur } from '@/api/database.types'

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
    (e.department ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.position ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-[28px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Employee Directory</h1>
        <p className="text-[#475467] text-sm mt-1">Connect with your colleagues across the organization.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-xl">
        <Input
          prefix={<SearchOutlined className="text-[#98A2B3]" />}
          placeholder="Search by name, position or department..."
          size="large"
          className="rounded-xl border-[#E4E7EC] h-[48px]"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Spin size="large" className="mb-4" />
          <span className="font-medium">Loading directory...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-12 text-center">
          <TeamOutlined className="text-4xl text-slate-100 mb-4" />
          <p className="text-[#475467] font-medium">No colleagues found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-sm hover:shadow-md hover:border-[#7c3aed] transition-all group flex flex-col items-center text-center"
            >
              <div className="relative mb-4">
                <Avatar
                  size={80}
                  src={emp.avatar_url}
                  icon={<UserOutlined />}
                  className="bg-[#f5f3ff] text-[#7c3aed] border-2 border-white shadow-sm"
                />
                <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <h3 className="text-[16px] font-bold text-[#101828] mb-1 truncate w-full px-2" title={emp.user_name ?? ''}>
                {emp.user_name || 'Anonymous'}
              </h3>
              <p className="text-[#7c3aed] text-[13px] font-bold mb-3 uppercase tracking-wider">
                {emp.position || 'Colleague'}
              </p>

              <div className="space-y-2 w-full mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center justify-center gap-2 text-[12px] text-[#475467]">
                  <BankOutlined className="text-[#98A2B3]" />
                  <span className="font-medium">{emp.department || 'General'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[12px] text-[#475467]">
                  <MailOutlined className="text-[#98A2B3]" />
                  <span className="truncate max-w-[180px]" title={emp.email ?? ''}>{emp.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
