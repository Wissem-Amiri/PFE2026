'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/api/AuthContext'
import { getProfile, updateProfile, uploadDocument } from '@/api/profile'
import { uploadJobPicture, getJobById } from '@/api/job'
import { applyToJob, getUserCandidatures } from '@/api/candidatures'
import type { FullProfile } from '@/api/database.types'
import { Input, Select, Upload, Button, message, Spin } from 'antd'
import {
  CloudUploadOutlined,
  LoadingOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  CheckCircleFilled,
  GlobalOutlined,
  UserOutlined,
  MailOutlined
} from '@ant-design/icons'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

/* ─── Validation Schema ────────────────────────────────────── */
const profileSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  position: yup.string().required('Position is required'),
  country: yup.string().required('Country is required'),
  timezone: yup.string().required('Timezone is required'),
  bio: yup.string().required('Bio is required').max(500, 'Bio is too long (max 500 chars)'),
  website: yup.string().url('Invalid URL format').nullable().transform(v => v === '' ? null : v),
  portfolio: yup.string().url('Invalid URL format').nullable().transform(v => v === '' ? null : v),
  experiences: yup.array().of(
    yup.object().shape({
      title: yup.string().required('Title is required'),
      company: yup.string().required('Company is required'),
      startDate: yup.string().required('Start date is required'),
      endDate: yup.string().required('End date is required')
        .test('date-order', 'End date must be after start date', function (value) {
          const { startDate } = this.parent
          if (!startDate || !value) return true
          return new Date(value) >= new Date(startDate)
        })
        .test('no-future', 'End date cannot be in the future', function (value) {
          if (!value) return true
          return new Date(value) <= new Date()
        }),
      projectUrl: yup.string().url('Invalid URL format').nullable().transform(v => v === '' ? null : v),
    })
  ),
})

type ProfileFormInputs = yup.InferType<typeof profileSchema>

/* ─── Constants ────────────────────────────────────────────── */
const COUNTRIES = [
  { value: 'United States', label: 'United States' },
  { value: 'France', label: 'France' },
  { value: 'Canada', label: 'Canada' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Tunisia', label: 'Tunisia' },
]

const TIMEZONES = [
  { value: 'Pacific Standard Time (PST) UTC-08:00', label: 'Pacific Standard Time (PST) UTC-08:00' },
  { value: 'Eastern Standard Time (EST) UTC-05:00', label: 'Eastern Standard Time (EST) UTC-05:00' },
  { value: 'Central European Time (CET) UTC+01:00', label: 'Central European Time (CET) UTC+01:00' },
  { value: 'West Africa Time (WAT) UTC+01:00', label: 'West Africa Time (WAT) UTC+01:00' },
]

export default function CompleteProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const applyToJobId = searchParams.get('applyTo')
  const [targetJobTitle, setTargetJobTitle] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [letterUrl, setLetterUrl] = useState<string | null>(null)
  const [uploadingLetter, setUploadingLetter] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormInputs>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: '', lastName: '', position: '', country: '', timezone: '', bio: '', website: '', portfolio: '',
      experiences: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "experiences"
  })

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(async ({ data }) => {
      if (data) {
        const names = (data.user_name || '').split(' ')
        const firstName = names[0] || ''
        const lastName = names.slice(1).join(' ') || ''

        let resolvedPosition = data.postulant?.position || '';

        if (applyToJobId) {
          const { data: jobDetails } = await getJobById(applyToJobId)
          if (jobDetails) {
            resolvedPosition = jobDetails.title
            setTargetJobTitle(jobDetails.title)
          }
        } else {
          const { data: candidatures } = await getUserCandidatures(user.id)
          if (candidatures && candidatures.length > 0) {
            resolvedPosition = candidatures[0].job?.title || resolvedPosition
          }
        }

        reset({
          firstName,
          lastName,
          position: resolvedPosition,
          country: data.postulant?.country || '',
          timezone: data.postulant?.timezone || '',
          bio: data.postulant?.bio || '',
          website: data.postulant?.website || '',
          portfolio: data.postulant?.portfolio || '',
          experiences: (data.postulant?.experiences as any[]) || [],
        })

        setAvatarUrl(data.avatar_url || null)
        setResumeUrl(data.postulant?.resume_url || null)
        setLetterUrl(data.postulant?.motivational_letter_url || null)
      }
      setLoading(false)
    })
  }, [user, reset, applyToJobId])

  const handleSave = async (values: ProfileFormInputs) => {
    if (!user) return
    setSaving(true)

    const fullName = `${values.firstName} ${values.lastName}`.trim()

    const updatePayload: Partial<FullProfile> = {
      user_name: fullName,
      avatar_url: avatarUrl,
      postulant: {
        position: values.position,
        country: values.country,
        timezone: values.timezone,
        bio: values.bio,
        website: values.website || null,
        portfolio: values.portfolio || null,
        resume_url: resumeUrl,
        motivational_letter_url: letterUrl,
        experiences: values.experiences?.map((exp: any) => ({
          ...exp,
          id: exp.id || Math.random().toString(36).substr(2, 9)
        })) || []
      }
    }

    const { error: profileError } = await updateProfile(user.id, updatePayload)

    if (profileError) {
      messageApi.error(`Error: ${profileError.message || 'while updating.'}`)
      setSaving(false)
      return
    }

    if (applyToJobId) {
      const { error: applyError } = await applyToJob(user.id, applyToJobId)
      if (applyError) {
        if (applyError.code === '23505') {
          messageApi.warning("Already applied, but profile updated.")
        } else {
          messageApi.error("Profile updated, but application error.")
        }
      } else {
        messageApi.success("Profile saved and application submitted!")
        setTimeout(() => router.push('/dashboard/postulant'), 1500)
      }
    } else {
      messageApi.success("Profile updated successfully.")
    }

    setSaving(false)
  }

  const handleAvatarUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingAvatar(true)
    const { publicUrl, error } = await uploadJobPicture(file)
    setUploadingAvatar(false)
    if (error || !publicUrl) onError('Error')
    else { setAvatarUrl(publicUrl); onSuccess('ok') }
  }

  const handleResumeUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingResume(true)
    const { publicUrl, error } = await uploadDocument(file)
    setUploadingResume(false)
    if (error || !publicUrl) onError('Error')
    else { setResumeUrl(publicUrl); onSuccess('ok') }
  }

  const handleLetterUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingLetter(true)
    const { publicUrl, error } = await uploadDocument(file)
    setUploadingLetter(false)
    if (error || !publicUrl) onError('Error')
    else { setLetterUrl(publicUrl); onSuccess('ok') }
  }

  if (loading) return <div className="flex items-center justify-center p-20"><Spin size="large" /></div>

  return (
    <div className="bg-[#F9FAFB] min-h-full">
      {contextHolder}

      <div className="max-w-[960px]">

        {/* Header Section */}
        <div className="flex justify-between items-end mb-10 pb-6 border-b border-[#F2F4F7]">
          <div>
            <h1 className="text-[30px] font-bold text-[#101828] mb-1 tracking-tight">Settings</h1>
            <p className="text-[14px] text-[#475467] m-0">Manage your personal and professional information.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/dashboard/postulant')} className="h-10 px-5 rounded-lg font-medium border-[#D0D5DD]">Cancel</Button>
            <Button type="primary" onClick={handleSubmit(handleSave)} loading={saving} className="h-10 px-5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] border-none font-medium text-white shadow-sm transition-colors">
              Save {applyToJobId && '& Apply'}
            </Button>
          </div>
        </div>

        {applyToJobId && targetJobTitle && (
          <div className="mb-8 p-4 bg-purple-50 border border-purple-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#101828] m-0">You are applying for: <span className="text-purple-600">{targetJobTitle}</span></p>
              <p className="text-[12px] text-[#667085] m-0">Complete your profile below to finalize your application.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleSave)} className="space-y-0">

          {/* 1. Profil Personnel */}
          <Section title="Personal Information" subtitle="Update your photo and contact details.">
            <FormRow label="Full Name" required>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Controller name="firstName" control={control} render={({ field }) => (
                    <Input {...field} placeholder="First name" className={`h-11 rounded-lg ${errors.firstName ? 'border-red-500' : ''}`} />
                  )} />
                  {errors.firstName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.firstName.message}</p>}
                </div>
                <div className="flex-1">
                  <Controller name="lastName" control={control} render={({ field }) => (
                    <Input {...field} placeholder="Last name" className={`h-11 rounded-lg ${errors.lastName ? 'border-red-500' : ''}`} />
                  )} />
                  {errors.lastName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.lastName.message}</p>}
                </div>
              </div>
            </FormRow>

            <FormRow label="Email address">
              <Input value={user?.email || ''} disabled className="h-11 rounded-lg bg-[#F9FAFB] cursor-not-allowed border-[#EAECF0]" prefix={<MailOutlined className="text-gray-400" />} />
            </FormRow>

            <FormRow label="Avatar" subtitle="This photo will be visible on your profile.">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#F9FAFB] border border-[#EAECF0] flex items-center justify-center shrink-0 shadow-inner">
                  {uploadingAvatar ? <LoadingOutlined className="text-[#7C3AED] text-xl" /> : avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserOutlined className="text-gray-300 text-[28px]" />}
                </div>
                <div className="flex-1">
                  <Upload.Dragger accept="image/*" showUploadList={false} customRequest={handleAvatarUpload} className="bg-white hover:border-[#7C3AED] group py-4">
                    <p className="m-0"><CloudUploadOutlined className="text-[#7C3AED] text-xl group-hover:scale-110 transition-transform" /></p>
                    <p className="text-[14px] mt-2 mb-0"><span className="text-[#7C3AED] font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-[12px] text-[#667085] m-0">SVG, PNG, JPG (max. 800×800px)</p>
                  </Upload.Dragger>
                </div>
              </div>
            </FormRow>
          </Section>

          {/* 2. Profil Professionnel */}
          <Section title="Professional Profile" subtitle="Highlight your skills and background.">
            <FormRow label="Current / target position" required>
              <div className="flex flex-col gap-2">
                <Controller name="position" control={control} render={({ field }) => (
                  <Input {...field} disabled={!!applyToJobId} className="h-11 rounded-lg bg-[#F9FAFB] cursor-not-allowed border-[#EAECF0]" placeholder="Developer, Designer..." />
                )} />
                <p className="text-[11px] text-[#667085] flex items-center gap-1.5 italic">
                  <CheckCircleFilled className="text-green-500 text-[10px]" />
                  Position is locked based on your application.
                </p>
              </div>
            </FormRow>

            <FormRow label="Location" required subtitle="Your country and current timezone.">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-gray-500 mb-1.5">Country</p>
                  <Controller name="country" control={control} render={({ field }) => (
                    <Select {...field} options={COUNTRIES} placeholder="Select a country" className="h-11 w-full" />
                  )} />
                  {errors.country && <span className="text-red-500 text-[11px] mt-1 font-medium">{errors.country.message}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-gray-500 mb-1.5">Timezone</p>
                  <Controller name="timezone" control={control} render={({ field }) => (
                    <Select {...field} options={TIMEZONES} placeholder="Timezone" className="h-11 w-full" />
                  )} />
                  {errors.timezone && <span className="text-red-500 text-[11px] mt-1 font-medium">{errors.timezone.message}</span>}
                </div>
              </div>
            </FormRow>

            <FormRow label="External links">
              <div className="flex flex-col gap-3">
                <Controller name="website" control={control} render={({ field }) => (
                  <Input  {...field} placeholder="Website (URL)" className="h-11 rounded-lg" prefix={<GlobalOutlined className="text-gray-400" />} />
                )} />
                <Controller name="portfolio" control={control} render={({ field }) => (
                  <Input {...field} placeholder="Portfolio (URL)" className="h-11 rounded-lg" prefix={<GlobalOutlined className="text-gray-400" />} />
                )} />
              </div>
            </FormRow>

            <FormRow label="Bio" subtitle="Briefly describe your background.">
              <Controller name="bio" control={control} render={({ field }) => (
                <Input.TextArea {...field} rows={5} placeholder="Passionate about design..." className={`rounded-lg resize-none p-3 ${errors.bio ? 'border-red-500' : ''}`} />
              )} />
              {errors.bio && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.bio.message}</p>}
            </FormRow>

            <FormRow label="Resume (CV)">
              <div className="w-full">
                {uploadingResume ? (
                  <div className="h-[76px] rounded-xl border border-dashed border-[#EAECF0] bg-[#F9FAFB] flex items-center justify-center"><LoadingOutlined className="text-[#7C3AED] text-xl" /></div>
                ) : resumeUrl ? (
                  <div className="h-[76px] rounded-xl border border-[#7C3AED] bg-[#F9F5FF] flex items-center justify-between px-5 group hover:bg-[#F4EBFF] transition-colors">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] text-[18px]">📄</div>
                      <div>
                        <p className="text-[14px] font-bold text-[#101828] m-0">My_Resume.pdf</p>
                        <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#7C3AED] font-semibold no-underline hover:underline">View file</a>
                      </div>
                    </div>
                    <CheckCircleFilled className="text-[#7C3AED] text-2xl" />
                  </div>
                ) : (
                  <Upload.Dragger accept=".pdf" showUploadList={false} customRequest={handleResumeUpload} className="bg-white hover:border-[#7C3AED] py-5">
                    <p className="m-0"><CloudUploadOutlined className="text-[#7C3AED] text-xl" /></p>
                    <p className="text-[14px] mt-2 mb-0"><span className="text-[#7C3AED] font-semibold">Upload your CV</span> or drag and drop</p>
                    <p className="text-[12px] text-[#667085] m-0">PDF format (max. 10MB)</p>
                  </Upload.Dragger>
                )}
              </div>
            </FormRow>
          </Section>

          {/* 3. Historique d'Expérience */}
          <div className="py-10">
            <div className="mb-8">
              <h3 className="text-[20px] font-bold text-[#101828] mb-1">Work Experience</h3>
              <p className="text-[14px] text-[#667085] m-0">Add your past experiences to enrich your profile.</p>
            </div>

            <div className="space-y-6">
              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-[#EAECF0] bg-[#FAFBFC] text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F2F4F7] flex items-center justify-center mb-3">
                    <span className="text-2xl">💼</span>
                  </div>
                  <p className="text-[14px] font-bold text-[#344054] m-0">Aucune expérience ajoutée</p>
                  <p className="text-[13px] text-[#667085] mt-1 m-0">Ajoutez vos expériences professionnelles pour enrichir votre profil.</p>
                </div>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="p-8 rounded-2xl border border-[#EAECF0] bg-[#FAFBFC] relative group transition-all hover:border-[#D0D5DD] hover:shadow-sm">
                  <button type="button" onClick={() => remove(index)} className="absolute top-5 right-5 text-[#98A2B3] hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors p-1">
                    <MinusCircleOutlined className="text-xl" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">Job Title <span className="text-red-500">*</span></label>
                      <Controller name={`experiences.${index}.title`} control={control} render={({ field }) => (
                        <Input {...field} placeholder="e.g. Senior Developer" className="h-11 rounded-lg" />
                      )} />
                      {errors.experiences?.[index]?.title && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].title.message}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">Company <span className="text-red-500">*</span></label>
                      <Controller name={`experiences.${index}.company`} control={control} render={({ field }) => (
                        <Input {...field} placeholder="e.g. Google" className="h-11 rounded-lg" />
                      )} />
                      {errors.experiences?.[index]?.company && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].company.message}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">Start Date <span className="text-red-500">*</span></label>
                      <Controller name={`experiences.${index}.startDate`} control={control} render={({ field }) => (
                        <Input {...field} type="date" className="h-11 rounded-lg px-3" />
                      )} />
                      {errors.experiences?.[index]?.startDate && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].startDate.message}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#344054] tracking-wide uppercase">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <Controller name={`experiences.${index}.endDate`} control={control} render={({ field }) => (
                        <Input {...field} type="date" className={`h-11 rounded-lg px-3 ${errors.experiences?.[index]?.endDate ? 'border-red-500' : ''}`} />
                      )} />
                      {errors.experiences?.[index]?.endDate && <span className="text-red-500 text-[11px] font-medium">{errors.experiences[index].endDate.message}</span>}
                    </div>
                  </div>
                </div>
              ))}

              <Button type="dashed" onClick={() => append({ title: '', company: '', startDate: '', endDate: null, projectUrl: '' })} block className="h-12 rounded-xl border-[#7F56D9] text-[#7F56D9] bg-[#F9F5FF] hover:bg-[#F4EBFF] hover:border-[#7F56D9] font-bold flex items-center justify-center gap-2">
                <PlusOutlined /> Add a professional experience
              </Button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-10 border-t border-[#EAECF0] mt-10">
            <Button onClick={() => router.push('/dashboard/postulant')} className="h-11 px-6 rounded-lg font-medium border-[#D0D5DD]">Cancel</Button>
            <Button type="primary" onClick={handleSubmit(handleSave)} loading={saving} className="h-11 px-6 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] border-none font-medium text-white shadow-md transition-all">
              Save {applyToJobId && '& Apply'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── UI Helper Components ───────────────────────────────────── */

function Section({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) {
  return (
    <div className="py-10 border-b border-[#F2F4F7] first:border-none first:pt-0">
      <div className="mb-8">
        <h3 className="text-[18px] font-bold text-[#101828] mb-1">{title}</h3>
        <p className="text-[14px] text-[#475467] m-0">{subtitle}</p>
      </div>
      <div className="space-y-8">
        {children}
      </div>
    </div>
  )
}

function FormRow({ label, subtitle, required, children }: { label: string, subtitle?: string, required?: boolean, children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-10">
      <div className="w-[280px] shrink-0 pt-1.5 flex flex-col">
        <span className="text-[14px] font-bold text-[#344054] tracking-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {subtitle && <span className="text-[13px] text-[#667085] mt-1 m-0 leading-relaxed">{subtitle}</span>}
      </div>
      <div className="flex-1 max-w-[560px]">
        {children}
      </div>
    </div>
  )
}
