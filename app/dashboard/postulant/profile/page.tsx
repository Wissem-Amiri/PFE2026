'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getProfile, updateProfile, uploadDocument } from '@/lib/profileService'
import { uploadJobPicture } from '@/lib/jobService' // using this for avatar
import { applyToJob } from '@/lib/candidatureService'
import type { Utilisateur } from '@/lib/database.types'
import { Form, Input, Select, Upload, Button, message, Space } from 'antd'
import { CheckCircleFilled, CloudUploadOutlined, LoadingOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'

// Country mock list
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

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)

  const [letterUrl, setLetterUrl] = useState<string | null>(null)
  const [uploadingLetter, setUploadingLetter] = useState(false)

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(({ data }) => {
      if (data) {
        // Split user_name into first and last for the UI
        const names = (data.user_name || '').split(' ')
        const firstName = names[0] || ''
        const lastName = names.slice(1).join(' ') || ''

        form.setFieldsValue({
          firstName,
          lastName,
          position: data.position || '',
          country: data.country || undefined,
          timezone: data.timezone || undefined,
          bio: data.bio || '',
          website: data.website || '',
          portfolio: data.portfolio || '',
          experiences: data.experiences || [],
        })

        setAvatarUrl(data.avatar_url || null)
        setResumeUrl(data.resume_url || null)
        setLetterUrl(data.motivational_letter_url || null)
      }
      setLoading(false)
    })
  }, [user, form])

  const handleSave = async (values: any) => {
    if (!user) return
    setSaving(true)

    const fullName = `${values.firstName} ${values.lastName}`.trim()

    // 1. Update Profile
    const { error: profileError } = await updateProfile(user.id, {
      user_name: fullName,
      position: values.position,
      country: values.country,
      timezone: values.timezone,
      bio: values.bio,
      website: values.website,
      portfolio: values.portfolio,
      experiences: values.experiences?.map((exp: any) => ({ ...exp, id: exp.id || Math.random().toString(36).substr(2, 9) })) || [],
      avatar_url: avatarUrl,
      resume_url: resumeUrl,
      motivational_letter_url: letterUrl
    } as any) // cast to any due to new fields

    if (profileError) {
      console.error("Profile Error Details:", profileError)
      messageApi.error("Erreur lors de la mise à jour du profil.")
      setSaving(false)
      return
    }

    // 2. If applying to a job, trigger application
    if (applyToJobId) {
      const { error: applyError } = await applyToJob(user.id, applyToJobId)
      if (applyError) {
        if (applyError.code === '23505') {
          messageApi.warning("Vous avez déjà postulé à cette offre, mais votre profil est mis à jour.")
        } else {
          messageApi.error("Profil mis à jour, mais erreur lors de la candidature.")
        }
      } else {
        messageApi.success("Profil sauvegardé et candidature envoyée avec succès !")
        setTimeout(() => router.push('/dashboard/postulant'), 1500)
      }
    } else {
      messageApi.success("Profil mis à jour avec succès.")
    }

    setSaving(false)
  }

  // Uploader configurations
  const customAvatarRequest = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingAvatar(true)
    const { publicUrl, error } = await uploadJobPicture(file) // reuse picture uploader
    setUploadingAvatar(false)
    if (error || !publicUrl) onError('Error')
    else { setAvatarUrl(publicUrl); onSuccess('ok') }
  }

  const customResumeRequest = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingResume(true)
    const { publicUrl, error } = await uploadDocument(file)
    setUploadingResume(false)
    if (error || !publicUrl) onError('Error')
    else { setResumeUrl(publicUrl); onSuccess('ok') }
  }

  const customLetterRequest = async (options: any) => {
    const { file, onSuccess, onError } = options
    setUploadingLetter(true)
    const { publicUrl, error } = await uploadDocument(file)
    setUploadingLetter(false)
    if (error || !publicUrl) onError('Error')
    else { setLetterUrl(publicUrl); onSuccess('ok') }
  }

  if (loading) return <div className="p-8 text-slate-400">Loading profile...</div>

  return (
    <div className="flex-1 p-[24px] px-[28px] max-w-5xl mx-auto h-full overflow-y-auto">
      {contextHolder}

      {/* Header */}
      <div className="flex justify-between items-center mb-[40px] border-b border-[#F2F4F7] pb-[20px]">
        <h1 className="text-[30px] font-semibold text-[#101828] m-0">Create</h1>
      </div>

      <Form form={form} onFinish={handleSave} layout="horizontal" requiredMark={false} className="flex flex-col gap-[32px]">

        {/* Personal Info Group */}
        <div>
          <div className="flex justify-between mb-[24px]">
            <div>
              <h3 className="text-[16px] font-medium text-[#101828] mb-[4px]">Personal info</h3>
              <p className="text-[14px] text-[#475467] m-0">Update your photo and personal details here.</p>
            </div>
            <div className="flex gap-[12px]">
              <Button onClick={() => router.push('/dashboard/postulant')} className="px-[16px] h-[40px] rounded-[8px] font-medium">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving} className="px-[16px] h-[40px] rounded-[8px] bg-[#7C3AED] hover:bg-[#6D28D9] border-none font-medium text-white">Save</Button>
            </div>
          </div>

          <div className="border-t border-[#F2F4F7]">
            {/* Name */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0 text-[14px] font-medium text-[#344054] pt-[10px]">Name</div>
              <div className="flex flex-1 gap-[16px]">
                <Form.Item name="firstName" className="m-0 flex-1" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="First name" className="h-[44px] rounded-[8px]" />
                </Form.Item>
                <Form.Item name="lastName" className="m-0 flex-1" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="Last name" className="h-[44px] rounded-[8px]" />
                </Form.Item>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0 text-[14px] font-medium text-[#344054] pt-[10px]">Email address</div>
              <div className="flex-1">
                <Input value={user?.email || ''} disabled className="h-[44px] rounded-[8px]" prefix={<span className="text-[#98A2B3]">✉</span>} />
              </div>
            </div>

            {/* Photo */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0">
                <div className="text-[14px] font-medium text-[#344054]">Your photo</div>
                <div className="text-[13px] text-[#475467] mt-[4px]">This will be displayed on your profile.</div>
              </div>
              <div className="flex flex-1 gap-[32px] items-center">
                <div className="w-[64px] h-[64px] rounded-full overflow-hidden bg-[#FAFAFA] border border-[#EAECF0] flex items-center justify-center shrink-0">
                  {uploadingAvatar ? <LoadingOutlined className="text-[#7C3AED] text-xl" /> : avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="text-[#98A2B3] text-2xl">☺</div>}
                </div>
                <div className="flex-1">
                  <Upload.Dragger accept="image/*" showUploadList={false} customRequest={customAvatarRequest} className="bg-white hover:border-[#7C3AED]">
                    <p className="ant-upload-drag-icon pt-3 mb-2"><CloudUploadOutlined className="text-[#7C3AED]" /></p>
                    <p className="text-[14px]"><span className="text-[#7C3AED] font-medium">Click to upload</span> or drag and drop</p>
                    <p className="text-[12px] text-[#475467]">SVG, PNG, JPG or GIF (max. 800×400px)</p>
                  </Upload.Dragger>
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0 text-[14px] font-medium text-[#344054] pt-[10px]">Role</div>
              <div className="flex-1">
                <Form.Item name="position" className="m-0" rules={[{ required: true, message: 'Required' }]}>
                  <Input placeholder="e.g. Product Designer" className="h-[44px] rounded-[8px]" />
                </Form.Item>
              </div>
            </div>

            {/* Country */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0 text-[14px] font-medium text-[#344054] pt-[10px]">Country</div>
              <div className="flex-1">
                <Form.Item name="country" className="m-0" rules={[{ required: true, message: 'Required' }]}>
                  <Select placeholder="Select Country" options={COUNTRIES} className="h-[44px] w-full *:rounded-[8px]" />
                </Form.Item>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0 text-[14px] font-medium text-[#344054] pt-[10px]">Timezone</div>
              <div className="flex-1">
                <Form.Item name="timezone" className="m-0" rules={[{ required: true, message: 'Required' }]}>
                  <Select placeholder="Select Timezone" options={TIMEZONES} className="h-[44px] w-full *:rounded-[8px]" />
                </Form.Item>
              </div>
            </div>

            {/* Website */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0 text-[14px] font-medium text-[#344054] pt-[10px]">Website URL</div>
              <div className="flex-1">
                <Form.Item name="website" className="m-0">
                  <Input placeholder="https://yourwebsite.com" className="h-[44px] rounded-[8px]" />
                </Form.Item>
              </div>
            </div>

            {/* Portfolio */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0 text-[14px] font-medium text-[#344054] pt-[10px]">Portfolio URL</div>
              <div className="flex-1">
                <Form.Item name="portfolio" className="m-0">
                  <Input placeholder="https://dribbble.com/yourprofile" className="h-[44px] rounded-[8px]" />
                </Form.Item>
              </div>
            </div>

            {/* Bio */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0">
                <div className="text-[14px] font-medium text-[#344054]">Bio</div>
                <div className="text-[13px] text-[#475467] mt-[4px]">Write a short introduction.</div>
              </div>
              <div className="flex-1">
                <Form.Item name="bio" className="m-0">
                  <Input.TextArea placeholder="I'm a Product Designer based in Melbourne..." rows={4} className="rounded-[8px] resize-none" />
                </Form.Item>
              </div>
            </div>

            {/* Upload Resume */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0">
                <div className="text-[14px] font-medium text-[#344054]">Upload resume</div>
                <div className="text-[13px] text-[#475467] mt-[4px]">Share with us your resume.</div>
              </div>
              <div className="flex-1">
                {uploadingResume ? (
                  <div className="h-[120px] rounded-[12px] border border-[#EAECF0] bg-[#F9FAFB] flex items-center justify-center">
                    <LoadingOutlined className="text-[#7C3AED] text-2xl" />
                  </div>
                ) : resumeUrl ? (
                  <div className="h-[72px] rounded-[12px] border border-[#7C3AED] bg-[#F9F5FF] flex items-center justify-between px-[20px]">
                    <div className="flex gap-[12px] items-center">
                      <div className="w-[40px] h-[40px] rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">📄</div>
                      <div>
                        <div className="text-[14px] font-medium text-[#101828]">Uploaded Resume.pdf</div>
                        <div className="text-[13px] text-[#7C3AED] hover:underline cursor-pointer"><a href={resumeUrl} target="_blank" rel="noreferrer">View file</a></div>
                      </div>
                    </div>
                    <CheckCircleFilled className="text-[#7C3AED] text-xl" />
                  </div>
                ) : (
                  <Upload.Dragger accept=".pdf,.doc,.docx" showUploadList={false} customRequest={customResumeRequest} className="bg-white hover:border-[#7C3AED]">
                    <p className="ant-upload-drag-icon pt-3 mb-2"><CloudUploadOutlined className="text-[#7C3AED]" /></p>
                    <p className="text-[14px]"><span className="text-[#7C3AED] font-medium">Click to upload</span> or drag and drop</p>
                    <p className="text-[12px] text-[#475467]">PDF, DOC, DOCX (max. 5MB)</p>
                  </Upload.Dragger>
                )}
              </div>
            </div>

            {/* Motivational Letter */}
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-[32px] py-[24px] border-b border-[#F2F4F7]">
              <div className="w-[280px] shrink-0">
                <div className="text-[14px] font-medium text-[#344054]">Motivational letter</div>
                <div className="text-[13px] text-[#475467] mt-[4px]">Share with us your letter.</div>
              </div>
              <div className="flex-1">
                {uploadingLetter ? (
                  <div className="h-[120px] rounded-[12px] border border-[#EAECF0] bg-[#F9FAFB] flex items-center justify-center">
                    <LoadingOutlined className="text-[#7C3AED] text-2xl" />
                  </div>
                ) : letterUrl ? (
                  <div className="h-[72px] rounded-[12px] border border-[#7C3AED] bg-[#F9F5FF] flex items-center justify-between px-[20px]">
                    <div className="flex gap-[12px] items-center">
                      <div className="w-[40px] h-[40px] rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">📄</div>
                      <div>
                        <div className="text-[14px] font-medium text-[#101828]">Motivational Letter.pdf</div>
                        <div className="text-[13px] text-[#7C3AED] hover:underline cursor-pointer"><a href={letterUrl} target="_blank" rel="noreferrer">View file</a></div>
                      </div>
                    </div>
                    <CheckCircleFilled className="text-[#7C3AED] text-xl" />
                  </div>
                ) : (
                  <Upload.Dragger accept=".pdf,.doc,.docx" showUploadList={false} customRequest={customLetterRequest} className="bg-white hover:border-[#7C3AED]">
                    <p className="ant-upload-drag-icon pt-3 mb-2"><CloudUploadOutlined className="text-[#7C3AED]" /></p>
                    <p className="text-[14px]"><span className="text-[#7C3AED] font-medium">Click to upload</span> or drag and drop</p>
                    <p className="text-[12px] text-[#475467]">PDF, DOC, DOCX (max. 5MB)</p>
                  </Upload.Dragger>
                )}
              </div>
            </div>

            {/* Experiences */}
            <div className="flex flex-col py-[24px] border-b border-[#F2F4F7]">
              <div className="mb-[24px]">
                <h3 className="text-[16px] font-medium text-[#101828] mb-[4px]">Experience history</h3>
                <p className="text-[14px] text-[#475467] m-0">Add your past roles and companies to stand out.</p>
              </div>

              <Form.List name="experiences">
                {(fields, { add, remove }) => (
                  <div className="flex flex-col gap-[24px]">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="p-[20px] rounded-[12px] border border-[#EAECF0] bg-gray-50/50 relative">
                        <button
                          type="button"
                          onClick={() => remove(name)}
                          className="absolute top-[16px] right-[16px] text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer"
                        >
                          <MinusCircleOutlined className="text-lg" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] pr-[32px]">
                          <Form.Item
                            {...restField}
                            name={[name, 'title']}
                            rules={[{ required: true, message: 'Missing title' }]}
                            className="m-0"
                            label={<span className="text-[13px] font-medium text-[#344054]">Job Title</span>}
                          >
                            <Input className="h-[40px] rounded-[8px]" />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'company']}
                            rules={[{ required: true, message: 'Missing company' }]}
                            className="m-0"
                            label={<span className="text-[13px] font-medium text-[#344054]">Company</span>}
                          >
                            <Input className="h-[40px] rounded-[8px]" />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'startDate']}
                            rules={[{ required: true, message: 'Missing start date' }]}
                            className="m-0"
                            label={<span className="text-[13px] font-medium text-[#344054]">Start Date</span>}
                          >
                            <Input type="date" className="h-[40px] rounded-[8px]" />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[name, 'endDate']}
                            dependencies={[['experiences', name, 'startDate']]}
                            rules={[
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value) return Promise.resolve()

                                  const startDateRaw = getFieldValue(['experiences', name, 'startDate'])
                                  if (startDateRaw && value) {
                                    const start = new Date(startDateRaw)
                                    const end = new Date(value)
                                    if (end < start) {
                                      return Promise.reject(new Error('End date must be after start date'))
                                    }
                                  }
                                  return Promise.resolve()
                                }
                              })
                            ]}
                            className="m-0"
                            label={<span className="text-[13px] font-medium text-[#344054]">End Date</span>}
                          >
                            <Input type="date" className="h-[40px] rounded-[8px]" />
                          </Form.Item>
                        </div>

                        <div className="mt-[16px]">
                          <Form.Item
                            {...restField}
                            name={[name, 'projectUrl']}
                            className="m-0"
                            label={<span className="text-[13px] font-medium text-[#344054]">Project URL (Optional)</span>}
                          >
                            <Input placeholder="https://..." className="h-[40px] rounded-[8px]" />
                          </Form.Item>
                        </div>
                      </div>
                    ))}

                    <Form.Item className="m-0">
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="h-[44px] rounded-[8px] text-[#7C3AED] border-[#E9D7FE] bg-[#F9F5FF] hover:border-[#7C3AED] font-medium">
                        Add New Experience
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-[12px] pt-[24px]">
            <Button onClick={() => router.push('/dashboard/postulant')} className="px-[16px] h-[40px] rounded-[8px] font-medium">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving} className="px-[16px] h-[40px] rounded-[8px] bg-[#7C3AED] hover:bg-[#6D28D9] border-none font-medium text-white">Save {applyToJobId && ' & Apply'}</Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
