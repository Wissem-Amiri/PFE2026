'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Input, Upload, message, Avatar, Spin, Select, DatePicker } from 'antd'
import dayjs from 'dayjs'
import {
  HiOutlineMail,
  HiOutlineUser,
  HiOutlineCloudUpload,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlinePencil
} from 'react-icons/hi'
import { useAuth } from '@/lib/auth'
import { getProfile, updateProfile, uploadAvatar, uploadDocument } from '@/app/api/profile'
import { applyToJob } from '@/app/api/applications'
import { getJobById } from '@/app/api/job'
import { countries } from '@/app/api/countries'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { FullProfile, Job, Experience } from '@/lib/database.types'

const { TextArea } = Input
const { Option } = Select

const schema = yup.object().shape({
  userName: yup.string().required('Full name is required'),
  bio: yup.string().required('Bio is required').max(400, 'Bio cannot exceed 400 characters'),
  position: yup.string().required('Role is required'),
  country: yup.string().required('Please select your country'),
})

interface FormValues {
  userName: string
  bio: string
  position: string
  country: string
}





export default function EmployeeApplyToJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string
  const { user, refreshProfile } = useAuth()

  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      userName: '',
      bio: '',
      position: '',
      country: ''
    }
  })

  const bio = watch('bio') || ''

  // Remaining UI states
  const [avatarUrl, setAvatarUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [resumeName, setResumeName] = useState('')
  const [resumeSize, setResumeSize] = useState('')
  const [letterUrl, setLetterUrl] = useState('')
  const [letterName, setLetterName] = useState('')
  const [letterSize, setLetterSize] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [showExpForm, setShowExpForm] = useState(false)
  const [newExp, setNewExp] = useState({ title: '', company: '', startDate: '', endDate: '' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [uploadingLetter, setUploadingLetter] = useState(false)

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !jobId) return

      setLoading(true)
      const [profileRes, jobRes] = await Promise.all([
        getProfile(user.id),
        getJobById(jobId)
      ])

      if (profileRes.data) {
        const p = profileRes.data
        setProfile(p)
        setValue('userName', p.user_name || '')
        setValue('bio', p.candidate?.bio || '')
        setValue('position', p.candidate?.position || '')
        setValue('country', p.candidate?.country || '')
        setAvatarUrl(p.avatar_url || '')

        const rUrl = p.candidate?.resume_url || ''
        setResumeUrl(rUrl)
        if (rUrl) {
          const fileName = rUrl.split('/').pop()?.split('?')[0] || 'Resume.pdf'
          setResumeName(decodeURIComponent(fileName))
        }

        const lUrl = p.candidate?.motivational_letter_url || ''
        setLetterUrl(lUrl)
        if (lUrl) {
          const fileName = lUrl.split('/').pop()?.split('?')[0] || 'Motivational_Letter.pdf'
          setLetterName(decodeURIComponent(fileName))
        }

        setExperiences(p.candidate?.experiences || [])
      }

      if (jobRes.data) {
        setJob(jobRes.data)
        // If position is empty, pre-fill it with job title
        if (!watch('position')) {
          setValue('position', jobRes.data.title)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [user?.id, jobId])

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) return
    setUploadingAvatar(true)
    const { publicUrl, error } = await uploadAvatar(user.id, file)
    if (error) {
      message.error('Failed to upload photo')
    } else if (publicUrl) {
      setAvatarUrl(publicUrl)
      message.success('Photo uploaded')
      // Refresh sidebar profile
      refreshProfile()
    }
    setUploadingAvatar(false)
    return false
  }

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true)
    const { publicUrl, error } = await uploadDocument(file)
    if (error) {
      message.error('Failed to upload resume')
    } else if (publicUrl) {
      setResumeUrl(publicUrl)
      setResumeName(file.name)
      setResumeSize(formatSize(file.size))
      message.success('Resume uploaded successfully.')
    }
    setUploadingResume(false)
    return false
  }

  const handleLetterUpload = async (file: File) => {
    setUploadingLetter(true)
    const { publicUrl, error } = await uploadDocument(file)
    if (error) {
      message.error('Failed to upload letter')
    } else if (publicUrl) {
      setLetterUrl(publicUrl)
      setLetterName(file.name)
      setLetterSize(formatSize(file.size))
      message.success('Letter uploaded')
    }
    setUploadingLetter(false)
    return false
  }

  const handleSave = async (values: FormValues) => {
    if (!user?.id || !jobId) return

    if (!resumeUrl) {
      message.error('Please upload your resume')
      return
    }

    if (!letterUrl) {
      message.error('Please upload your motivational letter')
      return
    }

    setSaving(true)
    try {
      // 1. Update Profile
      const { error: profileError } = await updateProfile(user.id, {
        user_name: values.userName,
        avatar_url: avatarUrl,
        candidate: {
          bio: values.bio,
          position: values.position,
          country: values.country,
          resume_url: resumeUrl,
          motivational_letter_url: letterUrl,
          experiences
        }
      })

      if (profileError) throw profileError

      // 2. Apply to Job
      const { error: applyError } = await applyToJob(user.id, jobId)
      if (applyError) {
        if (applyError.code === '23505') {
          message.warning('You have already applied for this position.')
        } else {
          throw applyError
        }
      } else {
        message.success('Application sent successfully!')
      }

      // Redirect to employee applications list
      router.push('/dashboard/employee/registrations')
    } catch (err: any) {
      message.error('Error: ' + (err.message || 'Something went wrong'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen p-8 md:p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-[30px] font-medium text-[#101828] mb-1 leading-tight">
            Apply to <span className="text-[#7F56D9]">{job?.title || 'Position'}</span>
          </h1>
          <p className="text-[#667085] text-[16px]">Update your photo and personal details to complete your application.</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="h-[44px] px-6 rounded-lg border-[#D0D5DD] text-[#344054] font-medium hover:text-[#7F56D9] hover:border-[#7F56D9]"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={handleSubmit(handleSave)}
            className="h-[44px] px-8 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] border-none font-medium shadow-sm"
          >
            Save
          </Button>
        </div>
      </div>

      <div className="max-w-4xl space-y-10">

        {/* Personal Info Section */}
        <section className="space-y-6">
          <div className="pb-5 border-b border-[#EAECF0]">
            <h2 className="text-[18px] font-medium text-[#101828]">Personal info</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <label className="text-[14px] font-medium text-[#344054]">Name <span className="text-red-500">*</span></label>
            <div className="md:col-span-2 space-y-1">
              <Controller
                name="userName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Your full name"
                    status={errors.userName ? 'error' : ''}
                    className="h-[44px] rounded-lg border-[#D0D5DD] focus:border-[#7F56D9] focus:ring-4 focus:ring-[#7F56D9]/10"
                    prefix={<HiOutlineUser className="text-gray-400 mr-2" />}
                  />
                )}
              />
              {errors.userName && <p className="text-red-500 text-[12px]">{errors.userName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <label className="text-[14px] font-medium text-[#344054]">Email address</label>
            <div className="md:col-span-2">
              <Input
                value={profile?.email || ''}
                disabled
                className="h-[44px] rounded-lg bg-gray-50 border-[#D0D5DD] text-[#667085]"
                prefix={<HiOutlineMail className="text-gray-400 mr-2" />}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pt-4">
            <div>
              <p className="text-[14px] font-medium text-[#344054]">Your photo</p>
              <p className="text-[14px] text-[#667085]">This will be displayed on your profile.</p>
            </div>
            <div className="md:col-span-2 flex items-center gap-6">
              <Avatar
                size={64}
                src={avatarUrl}
                icon={<HiOutlineUser />}
                className="shrink-0 border border-gray-100 shadow-sm"
              />
              <Upload
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
              >
                <div className="border border-dashed border-[#D0D5DD] rounded-lg px-8 py-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors w-full md:w-[320px]">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border-6 border-gray-100">
                    <HiOutlineCloudUpload className="text-[#667085] text-xl" />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-[#7F56D9]">Click to upload <span className="text-[#667085] font-normal">or drag and drop</span></p>
                    <p className="text-[12px] text-[#667085]">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                  </div>
                </div>
              </Upload>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#EAECF0]" />

        {/* Role & Bio Section */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <label className="text-[14px] font-medium text-[#344054]">Role <span className="text-red-500">*</span></label>
            <div className="md:col-span-2">
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g. Product Designer"
                    className="h-[44px] rounded-lg border-[#D0D5DD]"
                    disabled
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <label className="text-[14px] font-medium text-[#344054]">Country <span className="text-red-500">*</span></label>
            <div className="md:col-span-2 space-y-1">
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder="Select a country"
                    className="w-full h-[44px] custom-select"
                    optionFilterProp="label"
                    status={errors.country ? 'error' : ''}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {countries.map(c => (
                      <Option key={c.code} value={c.name} label={c.name}>
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                            alt={c.name}
                            className="w-5 h-auto rounded-sm object-contain"
                          />
                          <span className="text-[14px] text-[#344054]">{c.name}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                )}
              />
              {errors.country && <p className="text-red-500 text-[12px]">{errors.country.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pt-6 border-t border-[#F2F4F7]">
            <div>
              <p className="text-[14px] font-medium text-[#344054]">Bio <span className="text-red-500">*</span></p>
              <p className="text-[14px] text-[#667085]">Write a short introduction about yourself.</p>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    rows={5}
                    placeholder="Briefly describe your professional background..."
                    status={errors.bio ? 'error' : ''}
                    className="rounded-lg border-[#D0D5DD] p-4 text-[16px]"
                  />
                )}
              />
              <div className="flex justify-between items-center">
                {errors.bio ? (
                  <p className="text-red-500 text-[12px]">{errors.bio.message}</p>
                ) : (
                  <div />
                )}
                <p className="text-[14px] text-[#667085]">{400 - bio.length} characters left</p>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#EAECF0]" />

        {/* Uploads Section */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <p className="text-[14px] font-medium text-[#344054]">Upload resume <span className="text-red-500">*</span></p>
              <p className="text-[14px] text-[#667085]">Share with us your resume.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              {resumeUrl ? (
                <div className="flex items-center justify-between p-4 bg-white border border-[#9E77ED] rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-[#F4EBFF] flex items-center justify-center shrink-0">
                      <HiOutlineDocumentText className="text-[#7F56D9] text-xl" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[14px] font-medium text-[#344054] truncate">{resumeName}</p>
                      <p className="text-[12px] text-[#667085]">{resumeSize ? `${resumeSize} – 100% uploaded` : 'Click to see details'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlineCheckCircle className="text-[#7F56D9] text-xl" />
                    <button
                      onClick={() => { setResumeUrl(''); setResumeSize(''); }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              ) : (
                <Upload
                  showUploadList={false}
                  beforeUpload={handleResumeUpload}
                  className="w-full block-upload"
                >
                  <div className="border border-dashed border-[#D0D5DD] rounded-lg p-6 py-8 flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors w-full min-h-[108px] justify-center">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border-6 border-gray-100">
                      <HiOutlineCloudUpload className="text-[#667085] text-xl" />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-medium text-[#7F56D9]">Click to upload <span className="text-[#667085] font-normal">or drag and drop</span></p>
                      <p className="text-[12px] text-[#667085]">PDF, DOCX (max. 10MB)</p>
                    </div>
                  </div>
                </Upload>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <p className="text-[14px] font-medium text-[#344054]">Motivational letter <span className="text-red-500">*</span></p>
              <p className="text-[14px] text-[#667085]">Share your motivations with us.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              {letterUrl ? (
                <div className="flex items-center justify-between p-4 bg-white border border-[#9E77ED] rounded-lg shadow-sm min-h-[108px]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-[#F4EBFF] flex items-center justify-center shrink-0">
                      <HiOutlineDocumentText className="text-[#7F56D9] text-xl" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[14px] font-medium text-[#344054] truncate">{letterName}</p>
                      <p className="text-[12px] text-[#667085]">{letterSize ? `${letterSize} – 100% uploaded` : 'Click to see details'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlineCheckCircle className="text-[#7F56D9] text-xl" />
                    <button
                      onClick={() => { setLetterUrl(''); setLetterSize(''); }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              ) : (
                <Upload
                  showUploadList={false}
                  beforeUpload={handleLetterUpload}
                  className="w-full block-upload"
                >
                  <div className="border border-dashed border-[#D0D5DD] rounded-lg p-6 py-8 flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors w-full min-h-[108px] justify-center">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border-6 border-gray-100">
                      <HiOutlineCloudUpload className="text-[#667085] text-xl" />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-medium text-[#7F56D9]">Click to upload <span className="text-[#667085] font-normal">or drag and drop</span></p>
                      <p className="text-[12px] text-[#667085]">PDF, DOCX (max. 10MB)</p>
                    </div>
                  </div>
                </Upload>
              )}
            </div>
          </div>
        </section>

        <div className="h-px bg-[#EAECF0]" />

        {/* Work Experience Section */}
        <section className="space-y-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <p className="text-[14px] font-medium text-[#344054]">Work Experience</p>
              <p className="text-[14px] text-[#667085]">Add your previous professional roles to strengthen your application.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              {experiences.map((exp, index) => (
                <div key={index} className="p-4 bg-white border border-[#E4E7EC] rounded-lg flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center border border-[#EAECF0]">
                      <HiOutlineBriefcase className="text-[#667085] text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#101828] text-[14px]">{exp.title}</h4>
                      <p className="text-[12px] text-[#475467]">{exp.company} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(exp.id)
                        setNewExp({ title: exp.title, company: exp.company, startDate: exp.startDate, endDate: exp.endDate || '' })
                        setShowExpForm(true)
                      }}
                      className="text-gray-400 hover:text-[#7F56D9] transition-colors p-2"
                    >
                      <HiOutlinePencil size={18} />
                    </button>
                    <button
                      onClick={() => setExperiences(experiences.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {showExpForm ? (
                <div className="bg-[#F9FAFB] border border-[#EAECF0] rounded-xl p-6 space-y-4 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-[#344054]">Job Title</label>
                      <Input
                        placeholder="e.g. Full Stack Developer"
                        value={newExp.title}
                        onChange={e => setNewExp({ ...newExp, title: e.target.value })}
                        className="h-[40px] rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-[#344054]">Company</label>
                      <Input
                        placeholder="e.g. UnifyRH"
                        value={newExp.company}
                        onChange={e => setNewExp({ ...newExp, company: e.target.value })}
                        className="h-[40px] rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-[#344054]">Start Date</label>
                      <DatePicker
                        placeholder="Select date"
                        value={newExp.startDate ? dayjs(newExp.startDate) : null}
                        onChange={(date, dateString) => setNewExp({ ...newExp, startDate: Array.isArray(dateString) ? dateString[0] : dateString })}
                        disabledDate={(current) => {
                          return current && current > dayjs().endOf('day')
                        }}
                        className="w-full h-[40px] rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-[#344054]">End Date</label>
                      <DatePicker
                        placeholder="Select date"
                        value={newExp.endDate ? dayjs(newExp.endDate) : null}
                        onChange={(date, dateString) => setNewExp({ ...newExp, endDate: Array.isArray(dateString) ? dateString[0] : dateString })}
                        disabledDate={(current) => {
                          const isFuture = current && current > dayjs().endOf('day')
                          const isBeforeStart = current && newExp.startDate ? current.isBefore(dayjs(newExp.startDate), 'day') : false
                          return isFuture || isBeforeStart
                        }}
                        className="w-full h-[40px] rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowExpForm(false)
                        setEditingId(null)
                        setNewExp({ title: '', company: '', startDate: '', endDate: '' })
                      }}
                      className="rounded-lg h-[36px] px-4 border border-[#D0D5DD] bg-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (newExp.title && newExp.company && newExp.startDate) {
                          if (newExp.endDate && dayjs(newExp.endDate).isBefore(dayjs(newExp.startDate))) {
                            message.error('End date must be after start date.')
                            return
                          }

                          if (editingId) {
                            setExperiences(experiences.map(exp => exp.id === editingId ? { ...exp, ...newExp } : exp))
                            message.success('Experience updated')
                          } else {
                            setExperiences([...experiences, {
                              id: Math.random().toString(36).substr(2, 9),
                              ...newExp
                            }])
                            message.success('Experience added')
                          }

                          setNewExp({ title: '', company: '', startDate: '', endDate: '' })
                          setEditingId(null)
                          setShowExpForm(false)
                        } else {
                          message.warning('Please fill in title, company and start date.')
                        }
                      }}
                      className="rounded-lg h-[36px] px-4 bg-[#7F56D9] text-white border-none cursor-pointer"
                    >
                      {editingId ? 'Update Experience' : 'Add Experience'}
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  type="dashed"
                  onClick={() => setShowExpForm(true)}
                  icon={<HiOutlinePlus className="inline mr-2" />}
                  className="w-full h-[44px] rounded-lg text-[#7F56D9] border-[#D0D5DD] hover:border-[#7F56D9] flex items-center justify-center font-medium"
                >
                  Add Work Experience
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-8 border-t border-[#EAECF0] flex justify-end gap-3 pb-12">
          <Button
            className="h-[44px] px-6 rounded-lg border-[#D0D5DD] text-[#344054] font-medium hover:text-[#7F56D9] hover:border-[#7F56D9]"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={handleSubmit(handleSave)}
            className="h-[44px] px-8 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] border-none font-medium shadow-sm"
          >
            Save
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .ant-input, .ant-input-affix-wrapper, .ant-input-textarea {
          border-radius: 8px !important;
          border-color: #D0D5DD !important;
          box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05) !important;
        }
        .ant-input:hover, .ant-input:focus, .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper:focus {
          border-color: #7F56D9 !important;
          box-shadow: 0px 0px 0px 4px rgba(127, 86, 217, 0.1) !important;
        }
        .ant-input-textarea:hover, .ant-input-textarea:focus {
          border-color: #7F56D9 !important;
        }
        .custom-select .ant-select-selector {
          height: 44px !important;
          padding: 0 11px !important;
          display: flex !important;
          align-items: center !important;
          border-radius: 8px !important;
          border-color: #D0D5DD !important;
        }
        .custom-select .ant-select-selection-item {
          display: flex !important;
          align-items: center !important;
        }
        .block-upload .ant-upload {
          width: 100% !important;
          display: block !important;
        }
      `}</style>
    </div>
  )
}
