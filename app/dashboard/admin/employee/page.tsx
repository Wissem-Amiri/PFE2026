'use client'

import { useEffect, useState } from 'react'
import { SearchOutlined, TeamOutlined, MailOutlined, BankOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Input, Avatar, Card, Tag, Spin, Button, Modal, InputNumber, message, DatePicker, Select } from 'antd'
import { deleteUser, getAllUsers, updateUserStatus, getProfile, createEmployeeAccount, archiveUsers, unarchiveUsers, exportToCSV, downloadCSV } from '@/api/profile'
import { getAllJobs } from '@/api/job'
import { adjustEmployeeBalance } from '@/api/conge'
import type { FullProfile } from '@/api/database.types'
import { useRouter } from 'next/navigation'
import { HiOutlineX, HiOutlineTrash, HiOutlineDownload, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineArchive, HiOutlineRefresh, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useEmployees, useInfiniteEmployees, queryKeys } from '@/api/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { exportEmployeesToPDF } from '@/lib/export'

export default function AdminEmployeeListPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [showArchived, setShowArchived] = useState(false)
  const tablePageSize = 3
  const gridPageSize = 12

  const [isAdjusting, setIsAdjusting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<FullProfile | null>(null)
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid')

  const { ref, inView } = useInView()

  // ── DATA FETCHING ──
  // For Table View (Paginated)
  const { data: tableResult, isLoading: tableLoading } = useEmployees({
    page: currentPage,
    pageSize: tablePageSize,
    search: search,
    department: deptFilter === 'All Departments' ? undefined : deptFilter,
    showArchived
  })

  // For Grid View (Infinite Scroll)
  const {
    data: gridResult,
    isLoading: gridLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteEmployees({
    pageSize: gridPageSize,
    search: search,
    department: deptFilter === 'All Departments' ? undefined : deptFilter,
    showArchived
  })

  useEffect(() => {
    if (inView && hasNextPage && viewType === 'grid') {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage, viewType])

  const employees = viewType === 'table'
    ? (tableResult?.data || [])
    : (gridResult?.pages.flatMap(page => page.data) || [])

  const totalItems = tableResult?.count || 0
  const totalPages = Math.ceil(totalItems / tablePageSize)

  // States for Adding Employee
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<FullProfile[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isHiring, setIsHiring] = useState(false)
  const [hiringForm, setHiringForm] = useState({
    user_name: '',
    email: '',
    password: '',
    hire_date: dayjs(),
    department: 'IT',
    position: '',
    monthly_rate: 2.0
  })
  const [availableJobs, setAvailableJobs] = useState<any[]>([])

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let pass = ""
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pass
  }

  const openAddModal = () => {
    setHiringForm({
      ...hiringForm,
      password: generateRandomPassword()
    })
    setIsAddModalOpen(true)
  }

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.employees })
  }

  const fetchJobs = async () => {
    const { data } = await getAllJobs()
    if (data) setAvailableJobs(data)
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchJobs()
  }, [search, deptFilter, showArchived])

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length && employees.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(employees.map(e => e.id)))
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

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    try {
      if (showArchived) {
        await unarchiveUsers(ids)
        message.success(`${ids.length} employee(s) restored`)
      } else {
        await archiveUsers(ids)
        message.success(`${ids.length} employee(s) archived`)
      }
      setSelectedIds(new Set())
      refreshData()
    } catch (error) {
      message.error('Error during archiving')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return

    Modal.confirm({
      title: 'Delete Employees?',
      content: `Are you sure you want to permanently delete these ${selectedIds.size} employee(s)? This action is irreversible.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        const ids = Array.from(selectedIds)
        let successCount = 0
        for (const id of ids) {
          const { error } = await deleteUser(id)
          if (!error) successCount++
        }

        if (successCount > 0) {
          message.success(`${successCount} employee(s) deleted successfully`)
          setSelectedIds(new Set())
          refreshData()
        } else {
          message.error('Error during deletion')
        }
      }
    })
  }


  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return

    setIsDeleting(true)
    const { error } = await deleteUser(selectedEmployee.id)
    setIsDeleting(false)

    if (!error) {
      message.success('Employee deleted successfully')
      setIsDeleteModalOpen(false)
      setSelectedEmployee(null)
      refreshData()
    } else {
      message.error('Error during deletion')
    }
  }

  const handleAddEmployee = async () => {
    if (!hiringForm.user_name || !hiringForm.email || !hiringForm.password) {
      message.warning('Please fill in basic information (Name, Email, Password)')
      return
    }
    if (!hiringForm.position) {
      message.warning('Please enter a position')
      return
    }

    setIsHiring(true)

    // We use a dedicated function for creating a NEW employee account
    const { error } = await createEmployeeAccount({
      user_name: hiringForm.user_name,
      email: hiringForm.email,
      password: hiringForm.password,
      hire_date: hiringForm.hire_date.format('YYYY-MM-DD'),
      department: hiringForm.department,
      position: hiringForm.position,
      monthly_rate: hiringForm.monthly_rate
    })

    setIsHiring(false)

    if (!error) {
      message.success('Employee created successfully')
      setIsAddModalOpen(false)
      setHiringForm({
        user_name: '', email: '', password: '',
        hire_date: dayjs(), department: 'IT', position: '', monthly_rate: 2.0
      })
      refreshData()
    } else {
      message.error(error.message || 'Error during employee creation')
    }
  }

  const handleExportPDF = () => {
    if (employees.length === 0) {
      message.info('No employees to export')
      return
    }
    exportEmployeesToPDF(employees)
    message.success('PDF Export successful')
  }

  const departmentOptions = ['All Departments', 'IT', 'HR', 'Finance', 'Marketing', 'Operations'];
  const filtered = employees;

  return (
    <div
      className="p-[32px] px-[40px] bg-[#fcfcfd] min-h-full"
      onClick={() => setFocusedEmployeeId(null)}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-start gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#64748b] mb-2 cursor-pointer hover:text-[#7c3aed] transition-colors" onClick={() => router.push('/dashboard/admin')}>
              <ArrowLeftOutlined className="text-[10px]" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Back to Dashboard</span>
            </div>
            <h1 className="text-[24px] font-bold text-[#0f172a] tracking-tight mb-4">Employees</h1>

            <div className="flex bg-white border border-[#e2e8f0] rounded-[10px] p-[4px] shadow-sm w-fit">
              <button
                onClick={() => setViewType('grid')}
                className={`p-[6px] rounded-[6px] transition-all ${viewType === 'grid' ? 'bg-purple-50 text-[#7c3aed]' : 'text-[#64748b] hover:bg-gray-50'}`}
              >
                <HiOutlineViewGrid className="text-[20px]" />
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`p-[6px] rounded-[6px] transition-all ${viewType === 'table' ? 'bg-purple-50 text-[#7c3aed]' : 'text-[#64748b] hover:bg-gray-50'}`}
              >
                <HiOutlineViewList className="text-[20px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[16px]">
          <div className="flex items-center gap-[12px] px-[14px] py-[10px] border border-[#e2e8f0] rounded-[12px] bg-white shadow-sm w-[360px] focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <SearchOutlined className="text-[#64748b]" />
            <input
              placeholder="Search by name, position or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-none outline-none text-[14px] font-medium w-full text-[#101828] placeholder:text-[#98a2b3]"
            />
          </div>

          <Select
            value={deptFilter}
            onChange={value => setDeptFilter(value)}
            className="w-[220px] h-[42px]"
            styles={{ popup: { root: { borderRadius: '12px' } } }}
            options={departmentOptions.map(dept => ({ label: dept, value: dept }))}
          />

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-[8px] h-[42px] px-[17px] border rounded-[8px] text-[14px] font-semibold transition-all shadow-sm
              ${showArchived ? 'bg-[#F9FAFB] text-[#7c3aed] border-[#ddd6fe]' : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-gray-50'}`}
          >
            {showArchived ? <HiOutlineRefresh className="text-[18px]" /> : <HiOutlineArchive className="text-[18px]" />}
            {showArchived ? 'Active' : 'Archive'}
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-[8px] h-[42px] px-[17px] bg-white border border-[#e2e8f0] rounded-[8px] text-[#334155] text-[14px] font-semibold hover:bg-gray-50 transition-all shadow-sm"
          >
            <HiOutlineDownload className="text-[18px]" />
            Export
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-[8px] h-[42px] px-[20px] rounded-[8px] bg-[#7c3aed] border border-[#7c3aed] text-white text-[14px] font-semibold hover:bg-[#6d28d9] transition-all shadow-sm whitespace-nowrap"
          >
            <PlusOutlined />
            Add Employee
          </button>
        </div>
      </div>

      {/* ── SELECTION BAR ── */}
      {selectedIds.size > 0 && (
        <div className="mb-6 p-[12px] bg-[#FFFBFA] border border-[#FDA29B] rounded-[12px] flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-[12px]">
            <span className="text-[14px] font-semibold text-[#B42318]">{selectedIds.size} employee(s) selected</span>
            <button
              onClick={toggleSelectAll}
              className="text-[14px] font-semibold text-[#7F56D9] bg-transparent border-0 cursor-pointer hover:underline"
            >
              {selectedIds.size === employees.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex gap-[8px]">
            <button
              onClick={handleArchiveSelected}
              className="h-[40px] px-[16px] rounded-[8px] border border-[#FDA29B] bg-white text-[#B42318] font-semibold flex items-center gap-[8px] hover:bg-[#FFF1F0] hover:border-[#F97066] transition-all cursor-pointer shadow-sm"
            >
              {showArchived ? <HiOutlineRefresh className="text-[18px]" /> : <HiOutlineArchive className="text-[18px]" />}
              {showArchived ? 'Restore Selected' : 'Archive Selected'}
            </button>
            <button
              onClick={handleDeleteSelected}
              className="h-[40px] px-[16px] rounded-[8px] border border-[#FDA29B] bg-[#FEF3F2] text-[#B42318] font-semibold flex items-center gap-[8px] hover:bg-[#FEE4E2] hover:border-[#F97066] transition-all cursor-pointer shadow-sm"
            >
              <HiOutlineTrash className="text-[18px]" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {((viewType === 'table' && tableLoading) || (viewType === 'grid' && gridLoading && !gridResult)) ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Spin size="large" className="mb-4" />
          <span className="font-bold text-[14px] uppercase tracking-widest">Gathering team data...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] py-24 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#f9fafb] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#f2f4f7]">
            <TeamOutlined className="text-2xl text-[#d0d5dd]" />
          </div>
          <p className="text-[#101828] font-bold text-lg mb-1">No employees found</p>
          <p className="text-[#667085] text-sm">Try adjusting your filters or search terms.</p>
        </div>
      ) : viewType === 'grid' ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedEmployeeId(emp.id);
                }}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all group flex flex-col items-center text-center relative overflow-hidden cursor-pointer
                ${focusedEmployeeId === emp.id || selectedIds.has(emp.id) ? 'border-[#7c3aed] shadow-xl' : 'border-[#E4E7EC] hover:shadow-lg'}
                ${selectedIds.has(emp.id) ? 'bg-purple-50/30' : ''}`}
              >
                {/* Checkbox */}
                <div className="absolute top-4 right-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(emp.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectRow(emp.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded-md border-[#D0D5DD] checked:accent-[#7c3aed] cursor-pointer"
                  />
                </div>

                <div className="absolute top-0 left-0 p-4">
                  {focusedEmployeeId === emp.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployee(emp);
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-[32px] h-[32px] rounded-full bg-white border border-[#FEE2E2] text-[#F04438] flex items-center justify-center hover:bg-[#FEF3F2] transition-all shadow-md animate-in fade-in zoom-in duration-200"
                    >
                      <HiOutlineTrash className="text-[18px]" />
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
                  {emp.is_online && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-[3px] border-white rounded-full"></div>
                  )}
                </div>

                <h3 className="text-[17px] font-black text-[#101828] mb-1 truncate w-full px-2" title={emp.user_name ?? ''}>
                  {emp.user_name || 'Anonymous'}
                </h3>

                <div className="grid grid-cols-1 gap-3 w-full mt-auto pt-5 border-t border-[#f2f4f7]">
                  <div className="flex items-center justify-center gap-2.5 text-[12px] text-[#475467] font-medium">
                    <BankOutlined className="text-[#98A2B3]" />
                    <span>{emp.department || 'General'}</span>
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
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={ref} className="py-8 flex justify-center">
            {isFetchingNextPage ? (
              <Spin size="small" />
            ) : hasNextPage ? (
              <div className="h-4 w-4" />
            ) : employees.length > 0 && (
              <span className="text-[12px] text-slate-400 font-medium italic">All employees have been loaded</span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#eaecf0] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#eaecf0]">
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === employees.length && employees.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[#D0D5DD] checked:accent-[#7c3aed] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider w-[25%]">Employee</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider w-[20%]">Position</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider text-left w-[20%]">Department</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider w-[20%]">Date Hired</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#667085] uppercase tracking-wider text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaecf0]">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className={`hover:bg-gray-50 transition-colors group cursor-pointer ${selectedIds.has(emp.id) ? 'bg-purple-50/30' : ''}`}
                  onClick={() => router.push(`/dashboard/admin/employee/${emp.id}`)}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(emp.id)}
                      onChange={() => toggleSelectRow(emp.id)}
                      className="w-4 h-4 rounded border-[#D0D5DD] checked:accent-[#7c3aed] cursor-pointer"
                    />
                  </td>
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
                  <td className="px-6 py-4 text-[14px] text-[#475467] font-medium">
                    {emp.hire_date ? dayjs(emp.hire_date).format('MMM DD, YYYY') : '---'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      type="text"
                      danger
                      icon={<HiOutlineTrash className="text-lg" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployee(emp);
                        setIsDeleteModalOpen(true);
                      }}
                      className="hover:bg-red-50 rounded-lg flex items-center justify-center ml-auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PAGINATION ── */}
      {viewType === 'table' && totalItems > tablePageSize && (
        <div className="mt-12 flex justify-between items-center bg-white border border-[#eaecf0] rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 border border-[#d0d5dd] rounded-xl text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <HiOutlineChevronLeft className="text-lg" /> Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-[14px] font-semibold transition-all ${currentPage === i + 1
                  ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-100'
                  : 'text-[#667085] hover:bg-gray-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 border border-[#d0d5dd] rounded-xl text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next <HiOutlineChevronRight className="text-lg" />
          </button>
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

      {/* Add Employee Modal */}
      <Modal
        title={null}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        centered
        width={560}
        className="add-employee-modal"
      >
        <div className="p-8">
          <div className="mb-8">
            <div className="w-[56px] h-[56px] rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-4 border border-[#ddd6fe]">
              <TeamOutlined className="text-[#7c3aed] text-2xl" />
            </div>
            <h2 className="text-[24px] font-black text-[#101828] mb-1">Add Employee</h2>
            <p className="text-[#667085] text-[14px] font-medium">Promote an existing user to the employee role.</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#344054]">Full Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Ex: Ahmed Ben Ali"
                  value={hiringForm.user_name}
                  onChange={e => setHiringForm({ ...hiringForm, user_name: e.target.value })}
                  className="h-[48px] rounded-xl border-[#d0d5dd] font-medium"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#344054]">Email <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  placeholder="email@entreprise.com"
                  value={hiringForm.email}
                  onChange={e => setHiringForm({ ...hiringForm, email: e.target.value })}
                  className="h-[48px] rounded-xl border-[#d0d5dd] font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-bold text-[#344054]">Password <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <Input.Password
                  placeholder="********"
                  value={hiringForm.password}
                  onChange={e => setHiringForm({ ...hiringForm, password: e.target.value })}
                  className="h-[48px] rounded-xl border-[#d0d5dd] font-medium"
                />
                <Button
                  onClick={() => setHiringForm({ ...hiringForm, password: generateRandomPassword() })}
                  className="h-[48px] px-4 rounded-xl border-[#d0d5dd] hover:text-[#7c3aed] hover:border-[#7c3aed]"
                >
                  <HiOutlineRefresh className="text-lg" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#344054]">Department <span className="text-red-500">*</span></label>
                <select
                  value={hiringForm.department}
                  onChange={e => setHiringForm({ ...hiringForm, department: e.target.value })}
                  className="h-[48px] bg-white border border-[#d0d5dd] rounded-xl px-4 text-[14px] font-medium outline-none focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer"
                >
                  <option value="IT">IT & Development</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#344054]">Position <span className="text-red-500">*</span></label>
                <Select
                  showSearch
                  placeholder="Select a position"
                  value={hiringForm.position || undefined}
                  onChange={val => setHiringForm({ ...hiringForm, position: val })}
                  className="h-[48px] rounded-xl border-[#d0d5dd] font-medium w-full custom-hiring-select"
                  options={[
                    ...availableJobs.map(j => ({ value: j.title, label: j.title })),
                    { value: 'General Employee', label: 'Other / General' }
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#344054]">Hire Date <span className="text-red-500">*</span></label>
                <DatePicker
                  className="h-[48px] rounded-xl border-[#d0d5dd] w-full"
                  value={hiringForm.hire_date}
                  onChange={val => setHiringForm({ ...hiringForm, hire_date: val as any })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#344054]">Monthly Rate (Leaves) <span className="text-red-500">*</span></label>
                <InputNumber
                  step={0.1}
                  min={0}
                  className="h-[48px] rounded-xl border-[#d0d5dd] w-full flex items-center"
                  value={hiringForm.monthly_rate}
                  onChange={val => setHiringForm({ ...hiringForm, monthly_rate: val || 2.0 })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-[48px] rounded-xl border-[#d0d5dd] font-bold text-[#344054] hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={isHiring}
                onClick={handleAddEmployee}
                className="flex-1 h-[48px] rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] border-none font-bold text-white shadow-lg shadow-purple-100"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .ant-select-selector {
          border-radius: 12px !important;
          border-color: #eaecf0 !important;
          height: 42px !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 16px !important;
          font-weight: 600 !important;
          color: #344054 !important;
          box-shadow: 0 1px 2px 0 rgba(16, 24, 40, 0.05) !important;
        }
        .ant-select-selection-item {
          font-size: 14px !important;
        }
        .ant-select:hover .ant-select-selector {
          border-color: #d0d5dd !important;
        }
        .ant-select-focused .ant-select-selector {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1) !important;
        }
        
        .add-employee-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .ant-input-number-input-wrap {
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
        }
        .custom-hiring-select .ant-select-selector {
          height: 48px !important;
          border-radius: 12px !important;
        }
      `}</style>

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
  );
}
