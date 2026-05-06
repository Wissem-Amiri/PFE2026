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
import { useAuth } from '@/lib/auth'
import { useRecordings } from '@/lib/hooks'
import { queryKeys } from '@/lib/hooks'
import { uploadRecording } from '@/lib/recordings'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { downloadCSV } from '@/lib/export'
import { Modal, Tag, Badge } from 'antd'
import { HiOutlineSparkles, HiOutlineEye, HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineXCircle } from 'react-icons/hi'
import { processImagePresence, processVideoPresence, getPresenceFileUrl } from '@/lib/presence'
import { enrichDetections, type EnrichedDetection } from '@/lib/presenceUtils'

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

  // AI Analysis State
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [isResultModalVisible, setIsResultModalVisible] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<{
    detections: EnrichedDetection[];
    imagePath?: string;
    videoPath?: string;
  } | null>(null)

  const handleAnalyze = async (file: any) => {
    setAnalyzingId(file.id)
    try {
      // 1. Determine if it's image or video
      const isVideo = file.type?.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov')
      
      // 2. We need to send a File object to the AI API. 
      // Since the file is already on Supabase, we download it first to get a Blob
      const response = await fetch(file.url)
      const blob = await response.blob()
      const apiFile = new File([blob], file.name, { type: file.type || 'image/jpeg' })

      // 3. Call AI API
      let aiResult;
      if (isVideo) {
        aiResult = await processVideoPresence(apiFile)
      } else {
        aiResult = await processImagePresence(apiFile)
      }

      // 4. Enrich detections with Binome profile data
      const enriched = await enrichDetections(aiResult.detected_users)
      
      setAnalysisResults({
        detections: enriched,
        imagePath: aiResult.image_file_path,
        videoPath: aiResult.video_file_path
      })
      setIsResultModalVisible(true)
      message.success('AI Analysis complete!')
    } catch (error: any) {
      console.error('AI Analysis error:', error)
      message.error('Failed to analyze presence: ' + (error.message || 'Unknown error'))
    } finally {
      setAnalyzingId(null)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-[32px]">
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
        <div className="px-[24px] py-[12px] border-b border-[#EAECF0] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-wrap bg-white p-[2px] rounded-[8px] border border-[#D0D5DD] shadow-sm w-full xl:w-auto">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[12px] w-full xl:w-auto">
            <div className="relative w-full sm:w-auto">
              <HiOutlineSearch className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-[#667085]" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-[40px] py-[10px] w-full sm:w-[400px] rounded-[8px] border-[#D0D5DD] shadow-sm text-[16px]"
              />
            </div>
            <Button className="h-[44px] px-[16px] rounded-[8px] border-[#D0D5DD] shadow-sm flex items-center justify-center gap-[8px] font-semibold text-[#344054] w-full sm:w-auto">
              <HiOutlineFilter className="w-[20px] h-[20px]" />
              Filters
            </Button>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto no-scrollbar w-full">
          <div className="min-w-[1000px]">
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
                        <Button 
                          type="text"
                          loading={analyzingId === file.id}
                          onClick={() => handleAnalyze(file)}
                          className="text-[14px] font-semibold text-[#7F56D9] hover:text-[#6941C6] flex items-center gap-1.5 p-2 h-auto"
                        >
                          {!analyzingId && <HiOutlineSparkles className="w-4 h-4" />}
                          Analyze AI
                        </Button>
                        <button className="text-[14px] font-semibold text-[#667085] hover:text-[#344054] bg-transparent border-0 cursor-pointer p-2">View</button>
                        <button className="text-[14px] font-semibold text-[#D92D20] hover:text-[#B42318] bg-transparent border-0 cursor-pointer p-2">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination Section */}
        {totalItems > pageSize && (
          <div className="px-[24px] py-[16px] border-t border-[#EAECF0] flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
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

      {/* ── AI RESULTS MODAL ── */}
      <Modal
        title={
          <div className="flex items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full bg-[#F4EBFF] flex items-center justify-center text-[#7F56D9]">
              <HiOutlineSparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#101828] mb-0">AI Presence Analysis</h3>
              <p className="text-sm font-normal text-[#667085] mb-0">Detected employees and presence verification</p>
            </div>
          </div>
        }
        open={isResultModalVisible}
        onCancel={() => setIsResultModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsResultModalVisible(false)} className="rounded-lg h-10 px-6 font-semibold">
            Close
          </Button>
        ]}
        className="presence-modal"
      >
        <div className="flex flex-col lg:flex-row gap-6 py-4">
          {/* Left: Processed Media */}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[#344054] mb-3 flex items-center gap-2">
              <HiOutlineEye className="w-4 h-4" />
              Visual Analysis
            </h4>
            <div className="rounded-xl border border-[#EAECF0] overflow-hidden bg-gray-50 min-h-[300px] flex items-center justify-center relative shadow-inner">
              {analysisResults?.imagePath ? (
                <img 
                  src={getPresenceFileUrl(analysisResults.imagePath)} 
                  alt="Analysis" 
                  className="w-full h-auto object-contain max-h-[500px]"
                />
              ) : (
                <div className="text-center p-8">
                  <HiOutlineFilm className="w-12 h-12 text-[#D0D5DD] mb-3 mx-auto" />
                  <p className="text-[#667085]">Video analyzed. View detected list for results.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Detected List */}
          <div className="w-full lg:w-[350px] flex flex-col">
            <h4 className="text-sm font-semibold text-[#344054] mb-3 flex items-center gap-2">
              <HiOutlineUserGroup className="w-4 h-4" />
              Detected Members ({analysisResults?.detections.length || 0})
            </h4>
            <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {analysisResults?.detections.map((det, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-[#EAECF0] bg-white flex items-center justify-between hover:border-[#D6BBFB] transition-all">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={det.profile?.avatar_url}
                        size={40}
                        className="bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]"
                      >
                        {det.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#101828] mb-0 truncate">{det.profile?.user_name || det.name}</p>
                        <p className="text-xs text-[#667085] mb-0 truncate">{det.email}</p>
                      </div>
                    </div>
                    <div>
                      {det.attendance ? (
                        <Tag color="success" className="rounded-full border-0 font-medium px-2.5 flex items-center gap-1">
                          <HiOutlineShieldCheck className="w-3 h-3" />
                          Present
                        </Tag>
                      ) : (
                        <Tag color="error" className="rounded-full border-0 font-medium px-2.5 flex items-center gap-1">
                          <HiOutlineXCircle className="w-3 h-3" />
                          Absent
                        </Tag>
                      )}
                    </div>
                  </div>
                ))}
                {(!analysisResults?.detections || analysisResults.detections.length === 0) && (
                  <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-[#D0D5DD]">
                    <p className="text-[#667085] text-sm mb-0">No employees recognized in this file.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}


