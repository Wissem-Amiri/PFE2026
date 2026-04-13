'use client'

import { Form, Input, Select, DatePicker, Upload, message } from 'antd'
import { InboxOutlined, LoadingOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createJob, uploadJobPicture } from '@/lib/jobService'
import Link from 'next/link'

export default function CreateJobPage() {
  const [form] = Form.useForm()
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFinish = async (values: any) => {
    // Construct jobData
    const jobData = {
      title: values.title,
      category: values.category || 'Dummy', // fallback if empty
      description: values.description,
      deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : new Date().toISOString(),
      is_open: values.is_open ?? true,
      open_seats: values.open_seats,
      job_picture: imageUrl
    }

    const { error } = await createJob(jobData as any)
    
    if (error) {
      messageApi.error('Erreur lors de la création du Job')
    } else {
      messageApi.success('Job créé avec succès !')
      setTimeout(() => router.push('/dashboard/admin/jobs'), 1000)
    }
  }

  // Antd Upload Dragger props
  const draggerProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    customRequest: async (options: any) => {
      const { file, onSuccess, onError } = options
      setUploading(true)
      const { publicUrl, error } = await uploadJobPicture(file)
      setUploading(false)
      
      if (error || !publicUrl) {
        onError('Upload failed')
        messageApi.error(`${file.name} upload failed.`)
      } else {
        setImageUrl(publicUrl)
        onSuccess(null, file)
        messageApi.success(`${file.name} uploaded successfully.`)
      }
    }
  }

  return (
    <div className="flex-1 p-[24px] px-[28px] h-full overflow-y-auto bg-white">
      {contextHolder}
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-[32px]">
        <h1 className="text-[28px] font-bold text-[#101828] m-0">Create</h1>
        <div className="flex gap-[12px]">
          <button 
            type="button" 
            onClick={() => router.push('/dashboard/admin/jobs')}
            className="px-[16px] py-[8px] rounded-[8px] border border-[#D0D5DD] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => form.submit()}
            type="button"
            className="px-[16px] py-[8px] rounded-[8px] border border-[#7C3AED] bg-[#7C3AED] text-white font-medium text-[14px] cursor-pointer hover:bg-[#6D28D9]"
          >
            Save
          </button>
        </div>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleFinish}
        initialValues={{ open_seats: 1 }}
      >
        <div className="max-w-4xl">
          
          {/* Form Header Info */}
          <div className="mb-[32px] border-b border-[#F2F4F7] pb-[16px]">
            <h2 className="text-[18px] font-semibold text-[#101828] mb-1">Personal info</h2>
            <p className="text-[#475467] text-[14px]">Update your photo and personal details here.</p>
          </div>

          {/* Job Name */}
          <div className="grid grid-cols-[280px_1fr] gap-[32px] border-b border-[#F2F4F7] py-[24px]">
            <div>
              <span className="text-[14px] font-medium text-[#344054]">Job Name</span>
            </div>
            <div>
              <Form.Item name="title" rules={[{ required: true, message: 'Job name is required' }]} className="m-0">
                <Input 
                  placeholder="Ui/Ux design" 
                  size="large"
                  className="rounded-[8px] max-w-xl"
                />
              </Form.Item>
            </div>
          </div>

          {/* Missing necessary fields from Mockup 3 (Category & Deadline) - Placed discreetly to respect DB schema */}
          <div className="grid grid-cols-[280px_1fr] gap-[32px] border-b border-[#F2F4F7] py-[24px]">
            <div>
              <span className="text-[14px] font-medium text-[#344054]">Category & Deadline</span>
              <p className="text-[#475467] text-[13px] mt-1">Required internally.</p>
            </div>
            <div className="flex gap-4 max-w-xl">
              <Form.Item name="category" rules={[{ required: true }]} className="m-0 flex-1">
                <Select size="large" className="w-full" placeholder="Category" options={[
                  { value: 'Informatics', label: 'Informatics' },
                  { value: 'Business', label: 'Business' },
                  { value: 'Design', label: 'Design' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'Sales', label: 'Sales' },
                ]} />
              </Form.Item>
              <Form.Item name="deadline" rules={[{ required: true }]} className="m-0 flex-1">
                <DatePicker size="large" className="w-full rounded-[8px]" />
              </Form.Item>
            </div>
          </div>

          <div className="grid grid-cols-[280px_1fr] gap-[32px] border-b border-[#F2F4F7] py-[24px]">
            <div>
              <span className="text-[14px] font-medium text-[#344054]">Job Status</span>
            </div>
            <div>
              <Form.Item name="is_open" className="m-0">
                <Select 
                  size="large"
                  className="max-w-xl"
                  options={[
                    { value: true, label: 'Open' },
                    { value: false, label: 'Closed' }
                  ]}
                />
              </Form.Item>
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-[280px_1fr] gap-[32px] border-b border-[#F2F4F7] py-[24px]">
            <div>
              <span className="text-[14px] font-medium text-[#344054]">Description</span>
              <p className="text-[#475467] text-[13px] mt-1">Write a short introduction.</p>
            </div>
            <div>
              <Form.Item name="description" rules={[{ required: true, message: 'Description is required' }]} className="m-0">
                <Input.TextArea 
                  rows={5} 
                  placeholder="Lorem Ipsum..." 
                  className="rounded-[8px] max-w-xl"
                />
              </Form.Item>
              <p className="text-[#475467] text-[13px] mt-2">275 characters left</p>
            </div>
          </div>

          {/* Choose Job Picture */}
          <div className="grid grid-cols-[280px_1fr] gap-[32px] border-b border-[#F2F4F7] py-[24px]">
            <div>
              <span className="text-[14px] font-medium text-[#344054]">Choose Job picture</span>
              <p className="text-[#475467] text-[13px] mt-1">This will be displayed on Job profile.</p>
            </div>
            <div className="flex items-center gap-[32px] max-w-xl">
              {/* Image Preview */}
              <div className="w-[64px] h-[64px] rounded-full bg-[#FAFAFA] border border-[#EAECF0] flex-shrink-0 overflow-hidden flex items-center justify-center">
                {uploading ? (
                  <LoadingOutlined className="text-[#7C3AED] text-[20px]" />
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Job logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#4F46E5]"></div>
                )}
              </div>
              
              {/* Antd Dragger */}
              <div className="flex-1">
                <Upload.Dragger {...draggerProps} className="bg-white hover:border-[#7C3AED]" disabled={uploading}>
                  <p className="ant-upload-drag-icon pt-4 mb-2">
                    <InboxOutlined className="text-[#7C3AED] text-[24px]" />
                  </p>
                  <p className="text-[14px] text-[#344054] mb-1">
                    <span className="text-[#7C3AED] font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[12px] text-[#475467] pb-4 m-0">
                    SVG, PNG, JPG or GIF (max. 800×400px)
                  </p>
                </Upload.Dragger>
              </div>
            </div>
          </div>

          {/* Number of Open Seats */}
          <div className="grid grid-cols-[280px_1fr] gap-[32px] py-[24px] mb-[32px]">
            <div>
              <span className="text-[14px] font-medium text-[#344054]">Number of Open Seats</span>
            </div>
            <div>
              <Form.Item name="open_seats" className="m-0">
                <Select 
                  size="large"
                  className="max-w-xl"
                  options={Array.from({ length: 50 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }))}
                />
              </Form.Item>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-[12px] pt-[24px]">
            <button 
              type="button"
              onClick={() => router.push('/dashboard/admin/jobs')}
              className="px-[16px] py-[8px] rounded-[8px] border border-[#D0D5DD] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={() => form.submit()}
              className="px-[16px] py-[8px] rounded-[8px] border border-[#7C3AED] bg-[#7C3AED] text-white font-medium text-[14px] cursor-pointer hover:bg-[#6D28D9]"
            >
              Save
            </button>
          </div>

        </div>
      </Form>
    </div>
  )
}
