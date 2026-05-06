'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  BankOutlined, 
  IdcardOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { 
  Input, 
  Button, 
  Card, 
  Avatar, 
  Spin, 
  message, 
  Select, 
  InputNumber,
  Divider,
  Tag
} from 'antd'
import { getProfile, updateProfile } from '@/app/api/profile'
import { getAllJobs } from '@/app/api/job'
import type { FullProfile } from '@/lib/database.types'

export default function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [availableJobs, setAvailableJobs] = useState<any[]>([])

  const fetchProfile = async () => {
    setLoading(true)
    const { data, error } = await getProfile(id)
    if (error) {
      message.error('Failed to load profile')
      router.push('/dashboard/admin/employee')
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  const fetchJobs = async () => {
    const { data } = await getAllJobs()
    if (data) setAvailableJobs(data)
  }

  useEffect(() => {
    fetchProfile()
    fetchJobs()
  }, [id])

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    const { error } = await updateProfile(id, {
      user_name: profile.user_name,
      phone: profile.phone,
      employee: {
        position: profile.employee?.position,
        department: profile.employee?.department,
        monthly_rate: profile.employee?.monthly_rate,
        vacation_balance: profile.employee?.vacation_balance
      }
    } as any)
    
    setSaving(false)
    if (error) {
      message.error('Error updating profile')
    } else {
      message.success('Profile updated successfully')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfcfd]">
        <Spin size="large" />
        <span className="mt-4 font-bold text-[#667085] uppercase tracking-widest text-[12px]">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="p-[32px] px-[40px] bg-[#fcfcfd] min-h-full font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <button 
            onClick={() => router.push('/dashboard/admin/employee')}
            className="flex items-center gap-2 text-[#667085] mb-2 hover:text-[#7c3aed] transition-all group border-none bg-transparent p-0"
          >
            <ArrowLeftOutlined className="text-[12px] group-hover:-translate-x-1 transition-transform" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Back to Employees</span>
          </button>
          <h1 className="text-[28px] font-black text-[#101828] tracking-tight leading-none">Employee Settings</h1>
          <p className="text-[14px] text-[#667085] font-medium mt-2">View and update professional details for this team member.</p>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          loading={saving}
          onClick={handleSave}
          className="h-[48px] px-8 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] border-none font-bold text-[14px] shadow-lg shadow-purple-100"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[24px] border-[#eaecf0] shadow-sm overflow-hidden">
            <div className="flex flex-col items-center py-8">
              <div className="relative mb-6">
                <Avatar 
                  size={120} 
                  src={profile?.avatar_url} 
                  icon={<UserOutlined />}
                  className="bg-[#f5f3ff] text-[#7c3aed] border-[4px] border-white shadow-xl ring-1 ring-slate-100"
                />
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-[3px] border-white rounded-full"></div>
              </div>
              <h2 className="text-[20px] font-black text-[#101828] mb-1">{profile?.user_name}</h2>
              <div className="flex flex-col items-center gap-1">
                <Tag className="rounded-full border-none bg-[#F5F3FF] text-[#7C3AED] font-bold text-[10px] uppercase px-3 py-0.5">
                  {profile?.employee?.position || 'Employee'}
                </Tag>
                <span className="text-[12px] text-[#667085] font-medium">
                  {profile?.employee?.department || 'General'}
                </span>
              </div>
            </div>
            
            <Divider className="m-0" />
            
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#98a2b3] uppercase tracking-wider">Email Address</span>
                <div className="flex items-center gap-2 text-[#475467] font-medium">
                  <MailOutlined className="text-[#98a2b3]" />
                  <span className="text-[14px] truncate">{profile?.email}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#98a2b3] uppercase tracking-wider">Phone Number</span>
                <div className="flex items-center gap-2 text-[#475467] font-medium">
                  <span className="text-[#98a2b3] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 16.92V19.92C22.0012 20.1985 21.9441 20.4741 21.8325 20.7281C21.7209 20.9822 21.5573 21.2089 21.352 21.3934C21.1468 21.578 20.9048 21.716 20.6419 21.7981C20.379 21.8803 20.1013 21.9047 19.827 21.8697C16.742 21.4678 13.787 20.2588 11.233 18.337C8.847 16.559 6.822 14.534 5.044 12.148C3.111 9.58 1.902 6.608 1.511 3.504C1.476 3.23 1.501 2.953 1.583 2.691C1.666 2.428 1.803 2.186 1.988 1.981C2.173 1.776 2.399 1.613 2.653 1.501C2.907 1.389 3.183 1.332 3.461 1.333H6.462C6.945 1.328 7.414 1.505 7.771 1.828C8.127 2.15 8.347 2.597 8.384 3.078C8.452 4.025 8.683 4.956 9.07 5.84C9.204 6.147 9.248 6.486 9.196 6.817C9.144 7.148 9.001 7.458 8.782 7.712L7.512 8.982C9.176 11.907 11.593 14.324 14.518 15.988L15.788 14.718C16.042 14.499 16.352 14.356 16.683 14.304C17.014 14.252 17.353 14.296 17.66 14.43C18.544 14.817 19.475 15.048 20.422 15.116C20.908 15.153 21.36 15.378 21.683 15.743C22.006 16.108 22.177 16.587 22.16 17.078V16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span className="text-[14px]">{profile?.phone || 'No phone set'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#98a2b3] uppercase tracking-wider">Department</span>
                <div className="flex items-center gap-2 text-[#475467] font-medium">
                  <BankOutlined className="text-[#98a2b3]" />
                  <span className="text-[14px]">{profile?.employee?.department || 'Not Assigned'}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Professional Information */}
          <Card 
            title={<span className="text-[16px] font-black text-[#101828]">Professional Details</span>}
            className="rounded-[24px] border-[#eaecf0] shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#344054] flex items-center gap-2">
                  <UserOutlined className="text-[#98a2b3]" /> Full Name
                </label>
                <Input 
                  size="large"
                  value={profile?.user_name || ''}
                  onChange={e => setProfile(prev => prev ? ({ ...prev, user_name: e.target.value }) : null)}
                  className="rounded-xl border-[#d0d5dd] h-[48px] font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#344054] flex items-center gap-2">
                  <BankOutlined className="text-[#98a2b3]" /> Department
                </label>
                <Select
                  size="large"
                  className="w-full h-[48px] rounded-xl overflow-hidden"
                  value={profile?.employee?.department}
                  onChange={val => setProfile(prev => prev ? ({ 
                    ...prev, 
                    employee: { ...(prev.employee || {}), department: val } as any 
                  }) : null)}
                  options={[
                    { value: 'IT', label: 'IT & Development' },
                    { value: 'HR', label: 'Human Resources' },
                    { value: 'Finance', label: 'Finance' },
                    { value: 'Marketing', label: 'Marketing' },
                    { value: 'Sales', label: 'Sales' },
                    { value: 'Operations', label: 'Operations' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#344054] flex items-center gap-2">
                  <IdcardOutlined className="text-[#98a2b3]" /> Job Position
                </label>
                <Select
                  size="large"
                  showSearch
                  className="w-full h-[48px] rounded-xl overflow-hidden"
                  value={profile?.employee?.position}
                  onChange={val => setProfile(prev => prev ? ({ 
                    ...prev, 
                    employee: { ...(prev.employee || {}), position: val } as any 
                  }) : null)}
                  placeholder="Select position..."
                  options={[
                    ...availableJobs.map(j => ({ value: j.title, label: j.title })),
                    { value: 'General Employee', label: 'Other / General' }
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#344054] flex items-center gap-2">
                  <PhoneOutlined className="text-[#98a2b3]" /> Phone Number
                </label>
                <Input 
                  size="large"
                  placeholder="Ex: +216 12 345 678"
                  value={profile?.phone || ''}
                  onChange={e => setProfile(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                  className="rounded-xl border-[#d0d5dd] h-[48px] font-medium"
                />
              </div>
            </div>
          </Card>

          {/* Rate & Balance */}
          <Card 
            title={<span className="text-[16px] font-black text-[#101828]">Rate & Balance</span>}
            className="rounded-[24px] border-[#eaecf0] shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#344054] flex items-center gap-2">
                  <ClockCircleOutlined className="text-[#98a2b3]" /> Rate per month (Days/Month)
                </label>
                <InputNumber 
                  className="w-full h-[48px] flex items-center rounded-xl border-[#d0d5dd] font-bold text-[16px]"
                  value={profile?.employee?.monthly_rate}
                  onChange={val => setProfile(prev => prev ? ({ 
                    ...prev, 
                    employee: { ...(prev.employee || {}), monthly_rate: val || 0 } as any 
                  }) : null)}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#344054] flex items-center gap-2">
                  <CalendarOutlined className="text-[#98a2b3]" /> Vacation Balance (Days)
                </label>
                <InputNumber 
                  className="w-full h-[48px] flex items-center rounded-xl border-[#d0d5dd] font-bold text-[16px]"
                  value={profile?.employee?.vacation_balance}
                  onChange={val => setProfile(prev => prev ? ({ 
                    ...prev, 
                    employee: { ...(prev.employee || {}), vacation_balance: val || 0 } as any 
                  }) : null)}
                  step={0.5}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <style jsx global>{`
        .ant-card-head {
          border-bottom: 1px solid #eaecf0 !important;
          padding: 0 24px !important;
          min-height: 64px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-input-number-input {
          height: 48px !important;
        }
        .ant-select-selector {
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
          border-radius: 12px !important;
          border-color: #d0d5dd !important;
        }
      `}</style>
    </div>
  )
}
