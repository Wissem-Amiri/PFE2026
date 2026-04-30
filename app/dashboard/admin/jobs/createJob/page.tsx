'use client'

import { Input, Select, DatePicker, Upload, message, Tooltip } from 'antd'
import { InboxOutlined, LoadingOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { createJob, uploadJobPicture } from '@/api/job'
import dayjs from 'dayjs'

// --- YUP SCHEMA ---
const jobSchema = yup.object({
  title: yup.string().required('Job name is required').min(3, 'Title must be at least 3 characters'),
  category: yup.string().required('Category is required'),
  description: yup.string()
    .required('Description is required')
    .test('not-empty', 'Description cannot be empty or just spaces', (value) => value ? value.trim().length > 0 : false)
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description is too long'),
  deadline: yup.mixed().required('Deadline is required').test('is-future', 'Deadline cannot be in the past', (value) => {
    if (!value) return false;
    return dayjs(value as any).isAfter(dayjs().startOf('day'));
  }),
  is_open: yup.boolean().default(true),
  open_seats: yup.number().required('Number of seats is required').min(1, 'At least 1 seat required'),
  requirements: yup.string().required('Requirements are required').min(10, 'Please describe at least a few requirements'),
}).required();

type JobFormValues = yup.InferType<typeof jobSchema>;

export default function CreateJobPage() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: yupResolver(jobSchema),
    defaultValues: {
      is_open: true,
      open_seats: 1,
      title: '',
      description: '',
      requirements: '',
      category: undefined
    }
  })

  const descriptionValue = watch('description') || ''
  const charactersLeft = 500 - descriptionValue.length

  const onFinish = async (values: JobFormValues) => {
    const jobData = {
      title: values.title,
      category: values.category,
      description: values.description,
      requirements: values.requirements,
      deadline: dayjs(values.deadline as any).format('YYYY-MM-DD'),
      is_open: values.is_open,
      open_seats: values.open_seats,
      job_picture: imageUrl
    }

    const { error } = await createJob(jobData as any)
    
    if (error) {
      messageApi.error(`Error: ${error.message || 'while creating the job'}`)
    } else {
      messageApi.success('Job created successfully!')
      setTimeout(() => router.push('/dashboard/admin/jobs'), 1000)
    }
  }

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
    <div className="flex-1 p-[32px] h-full overflow-y-auto bg-white font-['Inter',sans-serif]">
      {contextHolder}
      
      <form onSubmit={handleSubmit(onFinish)}>
        {/* Top Header Section */}
        <div className="flex justify-between items-center mb-[48px]">
          <h1 className="text-[30px] font-medium text-[#101828] m-0">Create</h1>
          <div className="flex gap-[12px] items-center">
            <Tooltip title="Search">
              <button 
                type="button"
                className="p-[10px] rounded-[8px] hover:bg-gray-50 text-[#667085] transition-colors border-none bg-transparent cursor-pointer"
              >
                <SearchOutlined className="text-[20px]" />
              </button>
            </Tooltip>
            <button 
              type="button"
              className="flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] border border-[#D0D5DD] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
            >
              <DownloadOutlined className="text-[20px]" />
              Export
            </button>
          </div>
        </div>

        <div className="max-w-[1100px]">
          
          {/* Section Header with Actions */}
          <div className="flex justify-between items-start mb-[24px] border-b border-[#EAECF0] pb-[20px]">
            <div className="flex flex-col gap-[4px]">
              <h2 className="text-[18px] font-medium text-[#101828] m-0">Job Details</h2>
              <p className="text-[#667085] text-[14px] m-0">Define the position and requirements here.</p>
            </div>
            <div className="flex gap-[12px]">
              <button 
                type="button" 
                onClick={() => router.push('/dashboard/admin/jobs')}
                className="px-[16px] py-[10px] rounded-[8px] border border-[#D0D5DD] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-[16px] py-[10px] rounded-[8px] border border-[#7F56D9] bg-[#7F56D9] text-white font-medium text-[14px] cursor-pointer hover:bg-[#6941C6] transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>

          {/* Form Content using Flexbox layout */}
          <div className="flex flex-col">
            
            {/* Job Name */}
            <div className="flex py-[24px] border-b border-[#EAECF0]">
              <div className="w-[280px] pt-1">
                <span className="text-[14px] font-medium text-[#344054]">Job Name <span className="text-red-500">*</span></span>
              </div>
              <div className="flex-1 max-w-[512px]">
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                      <Input 
                        {...field}
                        placeholder="e.g. Senior UI/UX Designer" 
                        size="large"
                        className={`rounded-[8px] h-[44px] shadow-sm ${errors.title ? 'border-red-500' : 'border-[#D0D5DD]'}`}
                      />
                      {errors.title && <span className="text-red-500 text-[12px]">{errors.title.message}</span>}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Category & Deadline */}
            <div className="flex py-[24px] border-b border-[#EAECF0]">
              <div className="w-[280px]">
                <span className="text-[14px] font-medium text-[#344054]">Category & Deadline <span className="text-red-500">*</span></span>
                <p className="text-[#667085] text-[13px] mt-1 m-0">Select the field and closing date.</p>
              </div>
              <div className="flex-1 max-w-[512px] flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        {...field}
                        size="large" 
                        className="w-full h-[44px]" 
                        placeholder="Category" 
                        status={errors.category ? 'error' : ''}
                        options={[
                          { value: 'Informatics', label: 'Informatics' },
                          { value: 'Business', label: 'Business' },
                          { value: 'Design', label: 'Design' },
                          { value: 'Marketing', label: 'Marketing' },
                          { value: 'Sales', label: 'Sales' },
                          { value: 'Support Client', label: 'Support Client' },
                        ]} 
                      />
                    )}
                  />
                  {errors.category && <span className="text-red-500 text-[12px]">{errors.category.message}</span>}
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5">
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        {...field}
                        value={field.value ? dayjs(field.value as any) : null}
                        onChange={(date) => field.onChange(date)}
                        size="large" 
                        className="w-full rounded-[8px] h-[44px] shadow-sm" 
                        status={errors.deadline ? 'error' : ''}
                      />
                    )}
                  />
                  {errors.deadline && <span className="text-red-500 text-[12px]">{errors.deadline.message}</span>}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex py-[24px] border-b border-[#EAECF0]">
              <div className="w-[280px]">
                <span className="text-[14px] font-medium text-[#344054]">Description <span className="text-red-500">*</span></span>
                <p className="text-[#667085] text-[13px] mt-1 m-0">Write a short introduction.</p>
              </div>
              <div className="flex-1 max-w-[512px]">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                      <Input.TextArea 
                        {...field}
                        rows={5} 
                        placeholder="Enter job description..." 
                        className={`rounded-[8px] shadow-sm ${errors.description ? 'border-red-500' : 'border-[#D0D5DD]'}`}
                      />
                      <div className="flex justify-between items-center mt-1">
                        {errors.description ? (
                          <span className="text-red-500 text-[12px]">{errors.description.message}</span>
                        ) : (
                          <span className="text-transparent text-[12px]">.</span>
                        )}
                        <span className="text-[#667085] text-[14px]">{charactersLeft} characters left</span>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Requirements */}
            <div className="flex py-[24px] border-b border-[#EAECF0]">
              <div className="w-[280px]">
                <span className="text-[14px] font-medium text-[#344054]">Requirements <span className="text-red-500">*</span></span>
                <p className="text-[#667085] text-[13px] mt-1 m-0">Define what the candidate needs. Use one line per bullet point.</p>
              </div>
              <div className="flex-1 max-w-[512px]">
                <Controller
                  name="requirements"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                      <Input.TextArea 
                        {...field}
                        rows={4} 
                        placeholder="e.g. 3+ years React experience&#10;Strong communication skills" 
                        className={`rounded-[8px] shadow-sm ${errors.requirements ? 'border-red-500' : 'border-[#D0D5DD]'}`}
                      />
                      {errors.requirements && <span className="text-red-500 text-[12px]">{errors.requirements.message}</span>}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Choose Job Picture */}
            <div className="flex py-[24px] border-b border-[#EAECF0]">
              <div className="w-[280px]">
                <span className="text-[14px] font-medium text-[#344054]">Choose Job picture</span>
                <p className="text-[#667085] text-[13px] mt-1 m-0">This will be displayed on Job profile.</p>
              </div>
              <div className="flex-1 max-w-[512px] flex items-start gap-[20px]">
                {/* Image Preview - Styled as a Gradient Circle like Figma */}
                <div 
                  className="w-[64px] h-[64px] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-[#EAECF0]"
                  style={{ backgroundImage: imageUrl ? 'none' : 'linear-gradient(45deg, #29359B 0%, #6068CA 100%)' }}
                >
                  {uploading ? (
                    <LoadingOutlined className="text-white text-[24px]" />
                  ) : imageUrl ? (
                    <img src={imageUrl} alt="Job logo" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                
                {/* Antd Dragger - Styled to match Figma (FileUploadBase) */}
                <div className="flex-1">
                  <Upload.Dragger {...draggerProps} className="bg-white hover:border-[#D6BBFB] border-[#EAECF0] rounded-[8px]" disabled={uploading}>
                    <div className="py-[16px]">
                      <div className="flex justify-center mb-3">
                        <div className="w-[40px] h-[40px] rounded-full bg-[#F2F4F7] border border-[#F9FAFB] flex items-center justify-center">
                          <InboxOutlined className="text-[#667085] text-[20px]" />
                        </div>
                      </div>
                      <p className="text-[14px] text-[#6941C6] mb-1">
                        <span className="font-semibold">Click to upload</span> <span className="text-[#667085]">or drag and drop</span>
                      </p>
                      <p className="text-[12px] text-[#667085] m-0">
                        SVG, PNG, JPG or GIF (max. 800x400px)
                      </p>
                    </div>
                  </Upload.Dragger>
                </div>
              </div>
            </div>

            {/* Number of Open Seats */}
            <div className="flex py-[24px] border-b border-[#EAECF0]">
              <div className="w-[280px]">
                <span className="text-[14px] font-medium text-[#344054]">Number of Open Seats <span className="text-red-500">*</span></span>
              </div>
              <div className="flex-1 max-w-[512px]">
                <Controller
                  name="open_seats"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                      <Select 
                        {...field}
                        size="large"
                        className="w-full h-[44px]"
                        options={Array.from({ length: 50 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }))}
                      />
                      {errors.open_seats && <span className="text-red-500 text-[12px]">{errors.open_seats.message}</span>}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Job Status */}
            <div className="flex py-[24px]">
              <div className="w-[280px]">
                <span className="text-[14px] font-medium text-[#344054]">Job Status</span>
              </div>
              <div className="flex-1 max-w-[512px]">
                <Controller
                  name="is_open"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      {...field}
                      size="large"
                      className="w-full h-[44px]"
                      options={[
                        { value: true, label: 'Open' },
                        { value: false, label: 'Closed' }
                      ]}
                    />
                  )}
                />
              </div>
            </div>

          </div>

          {/* Bottom Footer Actions */}
          <div className="flex justify-end gap-[12px] pt-[32px] mt-[8px]">
            <button 
              type="button"
              onClick={() => router.push('/dashboard/admin/jobs')}
              className="px-[16px] py-[10px] rounded-[8px] border border-[#D0D5DD] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-[16px] py-[10px] rounded-[8px] border border-[#7F56D9] bg-[#7F56D9] text-white font-medium text-[14px] cursor-pointer hover:bg-[#6941C6] transition-colors shadow-sm"
            >
              Save
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}
