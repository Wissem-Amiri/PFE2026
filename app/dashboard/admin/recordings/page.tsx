'use client'

import { useState, useRef, useEffect } from 'react'
import { Input, Button, Avatar, Spin, Empty, message } from 'antd'
import {
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineCloudUpload,
  HiOutlineDotsVertical,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlineFilm,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi'
import { useAuth } from '@/api/AuthContext'
import { useRecordings } from '@/api/hooks'
import { queryKeys } from '@/api/hooks'
import { uploadRecording } from '@/api/recordings'
import { supabase } from '@/api/supabase'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { downloadCSV } from '@/api/export'

export default function RecordingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('View all')

  const { data: result, isLoading: loading } = useRecordings({
    page: currentPage,
    pageSize,
    search: search
  })

  const allRecordings = result?.data || []
  const totalItems = result?.count || 0
  
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath)

      await uploadRecording({
        name: file.name,
        url: publicUrl,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type,
        uploaded_by: user.id
      })

      message.success('File uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: queryKeys.recordings })
    } catch (error: any) {
      console.error('Upload error:', error)
      message.error(error.message || 'Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  const filteredFiles = allRecordings.filter(file => {
    // Tab filter (client side for now since it's simple)
    if (activeTab === 'Your files' && file.uploaded_by !== user?.id) return false
    return true
  })

  const totalPages = Math.ceil(totalItems / pageSize)

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab])

  const handleExport = () => {
    const headers = ['File Name', 'Size', 'Date Uploaded', 'Last Updated', 'Uploaded By', 'Uploader Email']
    const rows = filteredFiles.map(f => [
      f.name || 'Unnamed',
      f.size || '0 MB',
      dayjs(f.created_at).format('YYYY-MM-DD'),
      dayjs(f.updated_at).format('YYYY-MM-DD'),
      f.uploader?.user_name || 'Admin',
      f.uploader?.email || '-'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    downloadCSV(csvContent, `recordings_export_${dayjs().format('YYYY-MM-DD')}.csv`)
  }

  return (
    <div className="flex-1 p-[32px] h-full overflow-y-auto bg-[#FCFCFD]">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-[32px]">
        <h1 className="text-[30px] font-semibold text-[#101828] mb-0">Recordings</h1>
        <div className="flex items-center gap-[12px]">
          <div className="content-stretch flex items-center justify-center overflow-clip p-[10px] relative rounded-[8px] cursor-pointer hover:bg-gray-50 transition-all text-[#667085]">
            <HiOutlineSearch className="w-[20px] h-[20px]" />
          </div>
          <Button 
            onClick={handleExport}
            className="h-[44px] px-[16px] rounded-[8px] border-[#D0D5DD] shadow-sm flex items-center gap-[8px] font-semibold text-[#344054]"
          >
            <HiOutlineDownload className="w-[20px] h-[20px]" />
            Export
          </Button>
        </div>
      </div>

      {/* ── UPLOAD AREA ── */}
      <div className="mb-[32px]">
        <div className="border border-solid border-[#EAECF0] rounded-[12px] p-[24px] py-[16px] flex flex-col items-center">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*,audio/*,image/*,.pdf"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-[#D6BBFB] rounded-[8px] bg-[#FCFAFF] py-[16px] px-[24px] flex flex-col items-center cursor-pointer hover:bg-[#F9F5FF] transition-all"
          >
            {uploading ? (
              <div className="flex flex-col items-center py-2">
                <Spin />
                <p className="text-[14px] text-[#6941C6] mt-2 font-medium">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="w-[40px] h-[40px] rounded-full bg-[#F4EBFF] border-[6px] border-[#F9F5FF] flex items-center justify-center mb-[12px] text-[#6941C6]">
                  <HiOutlineCloudUpload className="w-[20px] h-[20px]" />
                </div>
                <div className="text-center">
                  <span className="text-[14px] font-semibold text-[#6941C6]">Click to upload</span>
                  <span className="text-[14px] text-[#667085]"> or drag and drop</span>
                  <p className="text-[12px] text-[#667085] mt-[4px] mb-0">Video, Audio, or Images (max. 50MB)</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── FILES TABLE ── */}
      <div className="border border-solid border-[#EAECF0] rounded-[12px] shadow-sm overflow-hidden bg-white">

        {/* Table Header Section */}
        <div className="px-[24px] py-[20px] border-b border-[#EAECF0] flex justify-between items-center">
          <div>
            <h3 className="text-[18px] font-semibold text-[#101828] mb-0">Attached files</h3>
            <p className="text-[14px] text-[#667085] mt-[4px] mb-0 font-normal">Files and assets that have been attached to this project.</p>
          </div>

        </div>

        {/* Tabs and Search Section */}
        <div className="px-[24px] py-[12px] border-b border-[#EAECF0] flex justify-between items-center">
          <div className="flex bg-white p-[2px] rounded-[8px] border border-[#D0D5DD] shadow-sm">
            {['View all', 'Your files'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-[16px] py-[10px] text-[14px] font-semibold rounded-[6px] transition-all border-0 cursor-pointer
                  ${activeTab === tab
                    ? 'bg-[#F9FAFB] text-[#344054]'
                    : 'bg-white text-[#344054] hover:bg-[#F9FAFB]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="relative">
              <HiOutlineSearch className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-[#667085]" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-[40px] py-[10px] w-[400px] rounded-[8px] border-[#D0D5DD] shadow-sm text-[16px]"
              />
            </div>
            <Button className="h-[44px] px-[16px] rounded-[8px] border-[#D0D5DD] shadow-sm flex items-center gap-[8px] font-semibold text-[#344054]">
              <HiOutlineFilter className="w-[20px] h-[20px]" />
              Filters
            </Button>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                <th className="pl-[24px] pr-[12px] py-[12px] text-left w-[48px]">
                  <div className="w-[20px] h-[20px] border border-[#D0D5DD] rounded-[6px] bg-white cursor-pointer hover:border-[#7F56D9]"></div>
                </th>
                <th className="px-[12px] py-[12px] text-left text-[12px] font-medium text-[#667085] uppercase tracking-wider">File name</th>
                <th className="px-[12px] py-[12px] text-left text-[12px] font-medium text-[#667085] uppercase tracking-wider">File size</th>
                <th className="px-[12px] py-[12px] text-left text-[12px] font-medium text-[#667085] uppercase tracking-wider">Date uploaded</th>
                <th className="px-[12px] py-[12px] text-left text-[12px] font-medium text-[#667085] uppercase tracking-wider">Last updated</th>
                <th className="px-[12px] py-[12px] text-left text-[12px] font-medium text-[#667085] uppercase tracking-wider">Uploaded by</th>
                <th className="pr-[24px] pl-[12px] py-[12px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-[100px] text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-[#667085]">Loading recordings...</p>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-[100px] text-center">
                    <Empty description="No recordings found" />
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#F9FAFB] transition-colors border-b border-[#EAECF0] last:border-0">
                    <td className="pl-[24px] pr-[12px] py-[16px]">
                      <div className="w-[20px] h-[20px] border border-[#D0D5DD] rounded-[6px] bg-white cursor-pointer hover:border-[#7F56D9] flex items-center justify-center">
                        {/* Selection logic can be added here */}
                      </div>
                    </td>
                    <td className="px-[12px] py-[16px]">
                      <div className="flex items-center gap-[12px]">
                        <div className="w-[40px] h-[40px] rounded-[8px] bg-[#F4EBFF] border border-[#F9F5FF] flex items-center justify-center shrink-0 text-[#6941C6]">
                          <HiOutlineFilm className="w-[20px] h-[20px]" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#101828] mb-0">{file.name}</p>
                          <p className="text-[14px] text-[#667085] mb-0 font-normal">{file.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-[12px] py-[16px] text-[14px] text-[#667085] font-normal">{file.size}</td>
                    <td className="px-[12px] py-[16px] text-[14px] text-[#667085] font-normal">{dayjs(file.created_at).format('MMM D, YYYY')}</td>
                    <td className="px-[12px] py-[16px] text-[14px] text-[#667085] font-normal">{dayjs(file.updated_at).format('MMM D, YYYY')}</td>
                    <td className="px-[12px] py-[16px]">
                      <div className="flex items-center gap-[12px]">
                        <Avatar
                          size={32}
                          src={file.uploader?.avatar_url}
                          className="bg-[#F2F4F7] text-[#344054] text-[12px] font-medium flex items-center justify-center"
                        >
                          {file.uploader?.user_name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <p className="text-[14px] font-medium text-[#101828] mb-0">{file.uploader?.user_name || 'Admin'}</p>
                          <p className="text-[14px] text-[#667085] mb-0 font-normal">{file.uploader?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="pr-[24px] pl-[12px] py-[16px]">
                      <div className="flex items-center gap-[12px] justify-end">
                        <button className="text-[14px] font-semibold text-[#6941C6] hover:text-[#53389E] bg-transparent border-0 cursor-pointer p-2">View</button>
                        <button className="text-[14px] font-semibold text-[#6941C6] hover:text-[#53389E] bg-transparent border-0 cursor-pointer p-2">Edit</button>
                        <button className="text-[14px] font-semibold text-[#D92D20] hover:text-[#B42318] bg-transparent border-0 cursor-pointer p-2">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalItems > pageSize && (
          <div className="px-[24px] py-[16px] border-t border-[#EAECF0] flex justify-between items-center bg-white">
            <Button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-[36px] px-[14px] rounded-[8px] border-[#D0D5DD] shadow-sm font-semibold text-[#344054] flex items-center gap-[8px]"
            >
              <HiOutlineChevronLeft className="w-[20px] h-[20px]" />
              Previous
            </Button>
            <div className="flex gap-[2px]">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(page)}
                    className={`w-[40px] h-[40px] flex items-center justify-center text-[14px] font-medium rounded-[8px] transition-all border-0 cursor-pointer
                      ${page === currentPage ? 'bg-[#F9F5FF] text-[#7F56D9]' : 'bg-transparent text-[#667085] hover:bg-[#F9FAFB]'}`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            <Button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-[36px] px-[14px] rounded-[8px] border-[#D0D5DD] shadow-sm font-semibold text-[#344054] flex items-center gap-[8px]"
            >
              Next
              <HiOutlineChevronRight className="w-[20px] h-[20px]" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


