'use client'

import { useEffect, useState } from 'react'
import { SearchOutlined, TeamOutlined, MailOutlined, BankOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Input, Avatar, Card, Tag, Spin, Button, Modal, InputNumber, message } from 'antd'
import { getAllUsers } from '@/api/profile'
import { adjustEmployeeBalance } from '@/api/conge'
import type { FullProfile } from '@/api/database.types'
import { useRouter } from 'next/navigation'
import { HiOutlineX, HiOutlineTrash } from 'react-icons/hi'
import { deleteUser } from '@/api/profile'

export default function AdminEmployeeListPage() {
  const [employees, setEmployees] = useState<FullProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const router = useRouter()
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<FullProfile | null>(null)
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<string | null>(null)

  const fetchEmployees = async () => {
    setLoading(true)
    const { data } = await getAllUsers()
    // Filter to only show approved employees
    const employeeList = (data ?? []).filter(u => u.role === 'employee' && u.status === 'approved')
    setEmployees(employeeList)
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])


  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return
    
    setIsDeleting(true)
    const { error } = await deleteUser(selectedEmployee.id)
    setIsDeleting(false)
    
    if (!error) {
      message.success('Employé supprimé avec succès')
      setIsDeleteModalOpen(false)
      setSelectedEmployee(null)
      fetchEmployees()
    } else {
      message.error('Erreur lors de la suppression')
    }
  }

  const departments = ['All Departments', ...Array.from(new Set(employees.map(e => e.employee?.department).filter(Boolean)))]

  const filtered = employees.filter(e => {
    const matchSearch = 
      (e.user_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.employee?.department ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.employee?.position ?? '').toLowerCase().includes(search.toLowerCase())
    
    const matchDept = deptFilter === 'All Departments' || e.employee?.department === deptFilter

    return matchSearch && matchDept
  })

  return (
    <div 
      className="p-[32px] px-[40px] bg-[#fcfcfd] min-h-full"
      onClick={() => setFocusedEmployeeId(null)}
    >
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

        <div className="flex items-center gap-[16px]">
          <div className="flex items-center gap-[12px] px-[14px] py-[10px] border border-[#eaecf0] rounded-[12px] bg-white shadow-sm w-[360px] focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <SearchOutlined className="text-[#667085]" />
            <input 
              placeholder="Search by name, position or department..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-none outline-none text-[14px] font-medium w-full text-[#101828] placeholder:text-[#98a2b3]"
            />
          </div>

          <div className="relative w-[180px]">
            <select 
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full bg-white border border-[#eaecf0] rounded-[12px] px-[16px] py-[10px] text-[14px] font-semibold text-[#344054] appearance-none focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer shadow-sm"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
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
              onClick={(e) => {
                e.stopPropagation()
                setFocusedEmployeeId(emp.id)
              }}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition-all group flex flex-col items-center text-center relative overflow-hidden cursor-pointer
                ${focusedEmployeeId === emp.id ? 'border-[#7c3aed] shadow-xl' : 'border-[#E4E7EC] hover:shadow-lg'}`}
            >
              <div className="absolute top-0 left-0 p-4">
                 {focusedEmployeeId === emp.id && (
                   <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEmployee(emp)
                      setIsDeleteModalOpen(true)
                    }}
                    className="w-[28px] h-[28px] rounded-full bg-white border border-[#FEE2E2] text-[#F04438] flex items-center justify-center hover:bg-[#FEF3F2] transition-all shadow-sm animate-in fade-in zoom-in duration-200"
                   >
                     <HiOutlineX className="text-[16px]" />
                   </button>
                 )}
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

              <div className="w-full mt-6">
                <Button 
                  onClick={() => router.push(`/dashboard/admin/employee/${emp.id}`)}
                  className="w-full h-[44px] rounded-xl bg-[#7c3aed] border-none font-bold text-[14px] text-white hover:bg-[#6d28d9] shadow-md shadow-purple-50"
                >
                  Détails
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Delete Confirmation Modal */}
      <Modal
        title={null}
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={null}
        centered
        width={400}
        className="delete-modal"
      >
        <div className="py-8 px-4 flex flex-col items-center text-center">
          <div className="w-[64px] h-[64px] rounded-full bg-[#FEF3F2] border-[8px] border-[#FFF1F0] flex items-center justify-center mb-6">
            <HiOutlineTrash className="text-[#F04438] text-[28px]" />
          </div>
          <h3 className="text-[20px] font-black text-[#101828] mb-2">Delete Employee?</h3>
          <p className="text-[14px] text-[#667085] font-medium leading-relaxed mb-8 max-w-[280px]">
            Are you sure you want to delete <span className="text-[#101828] font-bold">{selectedEmployee?.user_name}</span>? This action will permanently remove them from the database.
          </p>
          <div className="flex gap-3 w-full">
            <Button 
              onClick={() => setIsDeleteModalOpen(false)} 
              className="flex-1 h-[48px] rounded-xl border-[#D0D5DD] font-bold text-[#344054] hover:bg-[#F9FAFB]"
            >
              Cancel
            </Button>
            <Button 
              danger 
              type="primary" 
              loading={isDeleting}
              onClick={handleDeleteEmployee} 
              className="flex-1 h-[48px] rounded-xl bg-[#D92D20] hover:bg-[#B42318] border-none font-bold text-white shadow-lg shadow-red-100"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .delete-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 0 !important;
          overflow: hidden;
        }
      `}</style>

      <style jsx global>{`
        input::placeholder {
          color: #98a2b3 !important;
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
