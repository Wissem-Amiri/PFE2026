'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { getProfile, updateProfile, uploadAvatar } from '@/app/api/profile'
import { 
  Form, 
  Input, 
  Button, 
  Tabs, 
  Avatar, 
  message, 
  Skeleton,
  Tooltip,
  Spin
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CameraOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { useRouter, useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'

function AdminSettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'profile'
  
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoading(true)
      const { data } = await getProfile(user.id)
      setProfile(data)
      if (data) {
        form.setFieldsValue({
          user_name: data.user_name,
          phone: data.phone,
        })
        securityForm.setFieldsValue({
          email: user.email,
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [user, form, securityForm])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)

    try {
      // 1. Use centralized upload utility
      const { publicUrl, error: uploadError } = await uploadAvatar(user.id, file)
      if (uploadError) throw uploadError

      // 2. Update Profile in DB
      const { error: updateError } = await updateProfile(user.id, {
        avatar_url: publicUrl
      })
      if (updateError) throw updateError

      messageApi.success('Avatar updated successfully!')
      setProfile({ ...profile, avatar_url: publicUrl })
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      messageApi.error(error.message || 'Error uploading avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const { error } = await updateProfile(user.id, {
        avatar_url: null
      })
      if (error) throw error
      messageApi.success('Avatar removed.')
      setProfile({ ...profile, avatar_url: null })
    } catch (error: any) {
      messageApi.error('Error removing avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUpdateProfile = async (values: any) => {
    if (!user) return
    setSaving(true)
    const { error } = await updateProfile(user.id, {
      user_name: values.user_name,
      phone: values.phone,
    })
    
    if (error) {
      messageApi.error('Failed to update profile.')
    } else {
      messageApi.success('Profile updated successfully!')
      setProfile({ ...profile, ...values })
    }
    setSaving(false)
  }

  const handleUpdateSecurity = async (values: any) => {
    setSaving(true)
    const updates: any = {}
    
    if (values.email !== user?.email) {
      updates.email = values.email
    }
    if (values.password) {
      updates.password = values.password
    }

    if (Object.keys(updates).length === 0) {
      messageApi.info('No changes detected.')
      setSaving(false)
      return
    }

    // Use centralized auth update utility
    const { error } = await updateUser(updates)
    
    if (error) {
      messageApi.error(error.message)
    } else {
      messageApi.success('Security settings updated! Check your email if you changed it.')
      securityForm.resetFields(['password', 'confirmPassword'])
    }
    setSaving(false)
  }

  const ProfileTab = () => (
    <div className="max-w-[800px] animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-[16px] border border-[#eaecf0] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#eaecf0]">
          <h3 className="text-[18px] font-semibold text-[#101828] mb-1">Personal Information</h3>
          <p className="text-[14px] text-[#667085] mb-0">Update your photo and personal details here.</p>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-8 mb-8 pb-8 border-b border-[#f2f4f7]">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
            />
            <div className="relative group">
              <Avatar 
                size={80} 
                src={profile?.avatar_url} 
                className="bg-[#f4ebff] text-[#7f56d9] text-[24px] border-4 border-white shadow-md flex items-center justify-center"
              >
                {uploadingAvatar ? <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#7f56d9' }} spin />} /> : (profile?.user_name?.substring(0, 2).toUpperCase() || 'AD')}
              </Avatar>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <CameraOutlined className="text-white text-xl" />
              </div>
            </div>
            <div>
              <h4 className="text-[16px] font-semibold text-[#101828] mb-1">{profile?.user_name || 'Admin'}</h4>
              <p className="text-[14px] text-[#667085] mb-3 capitalize">{profile?.role} Account</p>
              <div className="flex gap-2">
                <Button 
                  size="small" 
                  className="rounded-lg text-[12px] font-medium border-[#d0d5dd]"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingAvatar}
                >
                  Change photo
                </Button>
                <Button 
                  size="small" 
                  type="text" 
                  className="text-[12px] font-medium text-[#d92d20]"
                  onClick={handleRemoveAvatar}
                  disabled={!profile?.avatar_url || uploadingAvatar}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            requiredMark={false}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
          >
            <Form.Item
              label={<span className="text-[14px] font-medium text-[#344054]">Full Name</span>}
              name="user_name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input prefix={<UserOutlined className="text-[#98a2b3] mr-2" />} placeholder="Your full name" className="h-[44px] rounded-[8px]" />
            </Form.Item>

            <Form.Item
              label={<span className="text-[14px] font-medium text-[#344054]">Phone Number</span>}
              name="phone"
            >
              <Input prefix={<PhoneOutlined className="text-[#98a2b3] mr-2" />} placeholder="+216 -- --- ---" className="h-[44px] rounded-[8px]" />
            </Form.Item>

            <div className="col-span-full pt-4 flex justify-end">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={saving}
                icon={<SaveOutlined />}
                className="h-[44px] px-6 rounded-[8px] bg-[#7f56d9] hover:bg-[#6941c6] border-none shadow-sm font-semibold"
              >
                Save Changes
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )

  const AccountTab = () => (
    <div className="max-w-[800px] animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-[16px] border border-[#eaecf0] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#eaecf0]">
          <h3 className="text-[18px] font-semibold text-[#101828] mb-1">Account & Security</h3>
          <p className="text-[14px] text-[#667085] mb-0">Manage your email and update your password.</p>
        </div>

        <div className="p-8">
          <Form
            form={securityForm}
            layout="vertical"
            onFinish={handleUpdateSecurity}
            requiredMark={false}
            className="space-y-4"
          >
            <Form.Item
              label={<span className="text-[14px] font-medium text-[#344054]">Email Address</span>}
              name="email"
              rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
              help="Changing your email will require confirmation on the new address."
            >
              <Input prefix={<MailOutlined className="text-[#98a2b3] mr-2" />} className="h-[44px] rounded-[8px]" />
            </Form.Item>

            <div className="h-px bg-[#f2f4f7] my-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Form.Item
                label={<span className="text-[14px] font-medium text-[#344054]">New Password</span>}
                name="password"
                rules={[{ min: 6, message: 'Password must be at least 6 characters' }]}
              >
                <Input.Password prefix={<LockOutlined className="text-[#98a2b3] mr-2" />} placeholder="••••••••" className="h-[44px] rounded-[8px]" />
              </Form.Item>

              <Form.Item
                label={<span className="text-[14px] font-medium text-[#344054]">Confirm New Password</span>}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined className="text-[#98a2b3] mr-2" />} placeholder="••••••••" className="h-[44px] rounded-[8px]" />
              </Form.Item>
            </div>

            <div className="col-span-full pt-4 flex justify-end">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={saving}
                className="h-[44px] px-6 rounded-[8px] bg-[#7f56d9] hover:bg-[#6941c6] border-none shadow-sm font-semibold"
              >
                Update Security
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-10 bg-[#fcfcfd] min-h-screen">
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    )
  }

  return (
    <div className="p-[32px] px-[40px] bg-[#fcfcfd] min-h-full font-['Inter',sans-serif]">
      {contextHolder}
      
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-[30px] font-semibold text-[#101828] mb-1">Settings</h1>
            <p className="text-[16px] text-[#667085] mb-0">Manage your profile and account settings.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="flex items-center gap-[8px] px-[16px] py-[10px] border border-[#D0D5DD] rounded-[8px] bg-white text-[#344054] font-medium text-[14px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeftOutlined /> Back to Home
          </button>
        </div>

        {/* Content Tabs */}
        <Tabs
          defaultActiveKey={defaultTab}
          className="settings-tabs"
          items={[
            {
              key: 'profile',
              label: (
                <span className="flex items-center gap-2">
                  <UserOutlined /> Profile
                </span>
              ),
              children: <ProfileTab />,
            },
            {
              key: 'account',
              label: (
                <span className="flex items-center gap-2">
                  <LockOutlined /> Account & Security
                </span>
              ),
              children: <AccountTab />,
            },
          ]}
        />
      </div>

      <style jsx global>{`
        .settings-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #eaecf0 !important;
        }
        .settings-tabs .ant-tabs-tab {
          padding: 12px 16px !important;
          margin: 0 !important;
          font-weight: 500 !important;
          color: #667085 !important;
          font-family: 'Inter', sans-serif !important;
        }
        .settings-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #7f56d9 !important;
        }
        .settings-tabs .ant-tabs-ink-bar {
          background: #7f56d9 !important;
          height: 2px !important;
        }
      `}</style>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-10 bg-[#fcfcfd] min-h-screen"><Skeleton active paragraph={{ rows: 12 }} /></div>}>
      <AdminSettingsContent />
    </Suspense>
  )
}

