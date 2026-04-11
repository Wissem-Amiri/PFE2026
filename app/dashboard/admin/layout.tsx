'use client'

import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'

const navItems = [
  { href: '/dashboard/admin', label: 'Home', icon: '🏠', badge: '10' },
  { href: '/dashboard/admin/registrations', label: 'Registrations', icon: '📋' },
  { href: '/dashboard/admin/leaves', label: 'Leaves', icon: '🏖️' },
  { href: '/dashboard/admin/employee', label: 'Employee', icon: '👥' },
  { href: '/dashboard/admin/jobs', label: 'Jobs', icon: '💼' },
  { href: '/dashboard/admin/recordings', label: 'Recordings', icon: '🎥' },
]
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen font-['Sora',sans-serif] bg-[#f8f7ff]">

        {/* ── SIDEBAR ── */}
        <aside className="w-[180px] min-w-[180px] bg-white border-r border-[#E4E7EC] flex flex-col h-screen sticky top-0">
          
          {/* Logo */}
          <div className="py-[18px] px-[18px] pb-[16px] border-b border-[#E4E7EC]">
            <span className="text-[24px] font-bold text-[#7c3aed] italic tracking-[-1px]">Yunr</span>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-[10px] py-[14px] flex flex-col gap-[2px] overflow-y-auto">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-[9px] px-[10px] py-[8px] rounded-[8px] text-[12px] font-medium transition-all no-underline
                    ${isActive
                      ? 'bg-[#EDE9FE] text-[#7C3AED]'
                      : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#101828]'
                    }`}
                >
                  <span className="text-[14px] w-[18px] text-center">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="ml-auto bg-[#7C3AED] text-white text-[9px] font-bold px-[6px] py-[2px] rounded-full">{item.badge}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-[10px] py-[14px] border-t border-[#E4E7EC]">
            <div className="flex items-center gap-[9px] px-[10px] py-[8px] rounded-[8px] text-[12px] font-medium text-[#475467] hover:text-[#7C3AED] cursor-pointer mb-[10px]" onClick={() => {/* Settings */}}>
              <span className="text-[14px] w-[18px] text-center">⚙️</span>
              Settings
            </div>
            
            <div className="flex items-center gap-[8px] px-[2px] cursor-pointer" onClick={signout}>
              <div className="w-[32px] h-[32px] rounded-full bg-[#EDE9FE] flex items-center justify-center text-[11px] font-bold text-[#7C3AED] overflow-hidden shrink-0">
                FA
              </div>
              <div className="overflow-hidden">
                <h5 className="text-[11px] font-semibold text-[#101828] mb-0 truncate">{profile?.user_name ?? 'Admin'}</h5>
                <p className="text-[10px] text-[#98A2B3] mb-0 truncate" title={user?.email}>{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-white min-w-0">
          {children}
        </main>
    </div>
  )
}
