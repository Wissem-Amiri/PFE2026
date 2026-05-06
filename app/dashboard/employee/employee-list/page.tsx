'use client'

import { useEffect, useState } from 'react'
import { SearchOutlined, TeamOutlined, MailOutlined, BankOutlined, UserOutlined } from '@ant-design/icons'
import { HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi'
import { Input, Avatar, Card, Tag, Spin, Select } from 'antd'
import { getEmployeesPaginated } from '@/app/api/profile'
import type { FullProfile } from '@/lib/database.types'

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<FullProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true)
      const { data } = await getEmployeesPaginated({
        page: 1,
        pageSize: 100, 
        search: debouncedSearch,
        department: deptFilter === 'All Departments' ? undefined : deptFilter,
        showArchived: false
      })
      setEmployees(data ?? [])
      setLoading(false)
    }
    fetchEmployees()
  }, [debouncedSearch, deptFilter])

  const filtered = employees // Data is already filtered by backend

  return (
    <div className="p-[28px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Employees</h1>
        <p className="text-[#475467] text-sm mt-1">Connect with your colleagues across the organization.</p>
      </div>

      {/* Search Bar & View Toggle */}
      <div className="mb-8 flex justify-between items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            prefix={<SearchOutlined className="text-[#98A2B3]" />}
            placeholder="Search..."
            size="large"
            className="rounded-xl border-[#E4E7EC] h-[48px]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={deptFilter}
            onChange={setDeptFilter}
            size="large"
            className="w-[200px] h-[48px]"
            options={[
              { value: 'All Departments', label: 'All Departments' },
              { value: 'IT', label: 'IT' },
              { value: 'HR', label: 'HR' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Marketing', label: 'Marketing' },
              { value: 'Operations', label: 'Operations' },
            ]}
          />

          <div className="flex bg-white border border-[#e2e8f0] rounded-[10px] p-[4px] shadow-sm w-fit">
            <button
              onClick={() => setViewType('grid')}
              className={`p-[6px] rounded-[6px] transition-all cursor-pointer border-none ${viewType === 'grid' ? 'bg-purple-50 text-[#7c3aed]' : 'bg-transparent text-[#64748b] hover:bg-gray-50'}`}
            >
              <HiOutlineViewGrid className="text-[20px]" />
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`p-[6px] rounded-[6px] transition-all cursor-pointer border-none ${viewType === 'table' ? 'bg-purple-50 text-[#7c3aed]' : 'bg-transparent text-[#64748b] hover:bg-gray-50'}`}
            >
              <HiOutlineViewList className="text-[20px]" />
            </button>
          </div>
        </div>
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
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-sm hover:shadow-md hover:border-[#7c3aed] transition-all group flex flex-col items-center text-center"
            >
              <div className="relative mb-4">
                <Avatar
                  size={80}
                  src={emp.avatar_url ?? undefined}
                  icon={<UserOutlined />}
                  className="bg-[#f5f3ff] text-[#7c3aed] border-2 border-white shadow-sm"
                />
                {emp.is_online && (
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <h3 className="text-[16px] font-bold text-[#101828] mb-1 truncate w-full px-2" title={emp.user_name ?? ''}>
                {emp.user_name || 'Anonymous'}
              </h3>
              <div className="mb-4">
                <span className="px-3 py-1 bg-[#F2F4F7] text-[#344054] text-[12px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                  {emp.position || 'Colleague'}
                </span>
              </div>

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
      ) : (
        <div className="bg-white rounded-2xl border border-[#eaecf0] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#eaecf0]">
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider w-[40%]">Employee</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider w-[30%]">Position</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider text-left w-[30%]">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaecf0]">
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar src={emp.avatar_url ?? undefined} icon={<UserOutlined />} className="bg-[#f5f3ff] text-[#7c3aed]" />
                        {emp.is_online && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[14px] font-bold text-[#101828] truncate">{emp.user_name}</div>
                        <div className="text-[12px] text-[#667085] truncate">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[14px] font-medium text-[#475467] truncate block">{emp.position || '---'}</span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-start">
                      <Tag color="purple" className="rounded-full px-3 font-semibold border-purple-100 m-0 w-fit text-center">
                        {emp.department || 'General'}
                      </Tag>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

