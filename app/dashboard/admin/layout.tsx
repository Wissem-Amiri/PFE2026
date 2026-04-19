'use client'

import { useAuth } from '@/api/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Avatar } from 'antd'

const navItems = [
  { href: '/dashboard/admin', label: 'Home', icon: '/assets/sidebar-home.svg', badge: '10' },
  { href: '/dashboard/admin/registrations', label: 'Registrations', icon: '/assets/sidebar-registrations.svg' },
  { href: '/dashboard/admin/leaves', label: 'Leaves', icon: '/assets/sidebar-leaves.svg' },
  { href: '/dashboard/admin/employee', label: 'Employee', icon: '/assets/sidebar-employees.svg' },
  { href: '/dashboard/admin/jobs', label: 'Jobs', icon: '/assets/sidebar-jobs.svg' },
  { href: '/dashboard/admin/recordings', label: 'Recordings', icon: '/assets/sidebar-recordings.svg' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen font-['Inter',sans-serif] bg-[#f9fafb]">

      {/* ── SIDEBAR ── */}
      <aside className="w-[243px] min-w-[243px] bg-[#fcfcfd] border-r border-[#eaecf0] flex flex-col h-screen sticky top-0">

        {/* Logo */}
        <div className="pt-[32px] pb-[24px] px-[24px]">
          <span className="text-[28px] font-black text-[#7F56D9] tracking-[-1px]">Yunr</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-[16px] py-[8px] flex flex-col gap-[4px] overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-[14px] font-medium transition-all no-underline
                    ${isActive
                    ? 'bg-[#f9f5ff] text-[#6941c6]'
                    : 'text-[#344054] hover:bg-[#f9fafb] hover:text-[#101828]'
                  }`}
              >
                <img src={item.icon} alt="" className={`w-[24px] h-[24px] ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-[#f9f5ff] text-[#6941c6] text-[12px] font-bold px-[10px] py-[2px] rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pb-[32px] px-[16px] flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[4px]">
             <div className="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-[16px] font-medium text-[#344054] hover:bg-[#f9fafb] cursor-pointer" onClick={() => {/* Settings */ }}>
              <img src="/assets/sidebar-settings.svg" className="w-[24px] h-[24px] opacity-70" alt="" />
              Settings
            </div>
          </div>

          <div className="h-px bg-[#eaecf0] w-full" />

          <div className="flex items-center justify-between px-[8px]">
            <div className="flex items-center gap-[12px] overflow-hidden">
              <Avatar
                size={40}
                src={profile?.avatar_url}
                className="bg-[#c7b9da] shrink-0"
              >
                {profile?.user_name?.substring(0, 2).toUpperCase() || 'AD'}
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <h5 className="text-[14px] font-medium text-[#101828] mb-0 truncate">{profile?.user_name ?? 'Admin'}</h5>
                <p className="text-[14px] text-[#667085] mb-0 truncate font-normal" title={user?.email}>{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={signout}
              className="bg-transparent border-none p-2 cursor-pointer hover:bg-slate-50 rounded-lg flex items-center justify-center transition-all"
            >
              <img src="/assets/sidebar-logout.svg" className="w-[20px] h-[20px]" alt="Logout" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto bg-white rounded-tl-[40px] shadow-[-10px_0_30px_rgba(0,0,0,0.02)] min-w-0">
        {children}
      </main>
    </div>
  )
}
