'use client'

import { useState } from 'react'

export default function RecordingsPage() {
  const [activeTab, setActiveTab] = useState('View all')

  const files = [
    { id: 1, name: 'Techcorp_v1.mp4', size: '2.4 MB', uploaded: 'Jan 4, 2024', updated: 'Jan 4, 2024', uploader: 'OW', uploaderBg: 'bg-[#9CA3AF]' },
    { id: 2, name: 'Design_Review.mp4', size: '5.1 MB', uploaded: 'Feb 10, 2024', updated: 'Feb 12, 2024', uploader: 'AD', uploaderBg: 'bg-[#7C3AED]' },
    { id: 3, name: 'Client_Meeting.mp4', size: '12.8 MB', uploaded: 'Mar 1, 2024', updated: 'Mar 1, 2024', uploader: 'PH', uploaderBg: 'bg-[#F59E0B]' },
  ]

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="text-[22px] font-bold text-[#101828] mb-0">Recordings</h1>
      </div>

      <div className="bg-white border border-[#E4E7EC] rounded-[12px] p-[24px] mb-[24px]">
        <div className="border-[1.5px] border-dashed border-[#D0D5DD] rounded-[12px] py-[32px] px-[20px] text-center bg-[#F9FAFB] cursor-pointer hover:border-[#7C3AED] hover:bg-[#F3F0FF] transition-all">
          <div className="w-[40px] h-[40px] rounded-full bg-white border border-[#E4E7EC] shadow-sm flex items-center justify-center text-[16px] text-[#475467] mx-auto mb-[12px]">
            ⬆
          </div>
          <h3 className="text-[14px] font-semibold text-[#101828] mb-[4px]">Click to upload or drag and drop</h3>
          <p className="text-[12px] text-[#475467] m-0">MP4, WEBM, or MKV (max. 500MB)</p>
        </div>
      </div>

      <div className="bg-white border border-[#E4E7EC] rounded-[12px] overflow-hidden">
        <div className="px-[20px] py-[16px] border-b border-[#E4E7EC] flex justify-between items-center">
          <div>
            <h3 className="text-[14px] font-semibold text-[#101828] m-0">Attached files</h3>
            <p className="text-[12px] text-[#475467] m-0 mt-[2px]">Files and assets attached to this project.</p>
          </div>
        </div>

        <div className="flex gap-[20px] px-[20px] pt-[16px] border-b border-[#E4E7EC]">
          {['View all', 'Your files'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-[12px] text-[13px] font-medium cursor-pointer relative ${activeTab === tab ? 'text-[#7C3AED]' : 'text-[#475467] hover:text-[#101828]'}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#7C3AED] rounded-t-[2px]"></div>
              )}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-semibold border-b border-[#E4E7EC] bg-[#F9FAFB]">File name</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-semibold border-b border-[#E4E7EC] bg-[#F9FAFB]">File size</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-semibold border-b border-[#E4E7EC] bg-[#F9FAFB]">Date uploaded</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-semibold border-b border-[#E4E7EC] bg-[#F9FAFB]">Last updated</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-semibold border-b border-[#E4E7EC] bg-[#F9FAFB]">Uploaded by</th>
                <th className="px-[20px] py-[12px] text-left text-[11px] text-[#475467] font-semibold border-b border-[#E4E7EC] bg-[#F9FAFB]"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="px-[20px] py-[14px] text-[13px] text-[#101828] font-medium border-b border-[#F2F4F7] align-middle">
                    <div className="flex items-center gap-[12px]">
                      <span className="text-[20px] text-[#475467] opacity-80">🎥</span>
                      <span>{file.name}</span>
                    </div>
                  </td>
                  <td className="px-[20px] py-[14px] text-[13px] text-[#475467] border-b border-[#F2F4F7] align-middle">{file.size}</td>
                  <td className="px-[20px] py-[14px] text-[13px] text-[#475467] border-b border-[#F2F4F7] align-middle">{file.uploaded}</td>
                  <td className="px-[20px] py-[14px] text-[13px] text-[#475467] border-b border-[#F2F4F7] align-middle">{file.updated}</td>
                  <td className="px-[20px] py-[14px] text-[13px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                    <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold text-white ${file.uploaderBg}`}>
                      {file.uploader}
                    </div>
                  </td>
                  <td className="px-[20px] py-[14px] text-[13px] text-[#475467] border-b border-[#F2F4F7] align-middle">
                    <div className="flex gap-[16px] items-center justify-end">
                      <span className="text-[12px] font-semibold text-[#7C3AED] cursor-pointer hover:underline">View</span>
                      <span className="text-[14px] cursor-pointer opacity-60 hover:opacity-100">✏️</span>
                      <span className="text-[14px] cursor-pointer opacity-60 hover:opacity-100">🗑️</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
