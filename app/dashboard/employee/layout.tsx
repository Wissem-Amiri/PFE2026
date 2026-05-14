'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import NotificationBell from '../../../components/NotificationBell'

import Image from 'next/image'
import { 
  HiOutlineCog, 
  HiOutlineLogout,
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineDocumentText
} from 'react-icons/hi'
import { usePathname } from 'next/navigation'
import { useMyLeaves } from '@/lib/hooks'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { data: leavesData } = useMyLeaves(user?.id || '', { page: 1, pageSize: 1 })
  const totalLeaves = leavesData?.count || 0

  const navItems = [
    { href: '/dashboard/employee', label: 'Home', icon: <HiOutlineHome />, badge: totalLeaves > 0 ? totalLeaves.toString() : undefined },
    { href: '/dashboard/employee/registrations', label: 'Registrations', icon: <HiOutlineClipboardList /> },
    { href: '/dashboard/employee/applications', label: 'My Applications', icon: <HiOutlineDocumentText /> },
    { href: '/dashboard/employee/employee-list', label: 'Employees', icon: <HiOutlineUserGroup /> },
  ]

  // Get initials for avatar
  const initials = profile?.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EM'

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-['Inter',sans-serif] bg-white">

      {/* ── MOBILE HEADER ── */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#eaecf0] sticky top-0 z-40">
        <Link href="/dashboard/employee" className="block no-underline">
          <img src="/assets/UnifyHR.png" alt="UnifyHR Logo" className="h-[80px] w-auto object-contain -ml-4" />
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* ── OVERLAY (Mobile) ── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR (Figma Fidelity) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[243px] min-w-[243px] bg-[#FCFCFD] border-r border-[#EAECF0] flex flex-col h-screen transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 overflow-clip ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo Section (UnifyRH) */}
        <div className="pt-[32px] pb-[24px] pl-[16px]">
          <Link href="/dashboard/employee" className="block no-underline">
            <div className="flex items-center">
              <img
                src="/assets/UnifyHR.png"
                alt="UnifyHR Logo"
                className="h-[130px] w-auto object-contain -ml-7 -mt-[42px] -mb-12 "
              />
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-[8px] flex flex-col gap-[4px] overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-[12px] py-[8px] rounded-[6px] text-[14px] font-medium transition-all no-underline
                    ${isActive
                    ? 'bg-[#F9F5FF] text-[#6941C6]'
                    : 'bg-transparent text-[#344054] hover:bg-[#F9FAFB]'
                  }`}
              >
                <div className="flex items-center gap-[12px]">
                  <span className={`text-[20px] ${isActive ? 'text-[#6941C6]' : 'text-[#344054]'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {item.badge && item.label === 'Home' && (
                  <div className="bg-[#F9F5FF] mix-blend-multiply flex items-center justify-center px-[10px] py-[2px] rounded-[16px]">
                    <span className="text-[#6941C6] text-[14px] font-medium leading-[20px]">
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer (Settings + User) */}
        <div className="px-[16px] py-[24px]">
          <div className="flex items-center justify-between pr-[4px] mb-[24px]">
            <Link
              href="/dashboard/employee/settings"
              className={`flex-1 flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] text-[14px] font-semibold transition-all no-underline
                ${pathname === '/dashboard/employee/settings'
                  ? 'bg-[#F9F5FF] text-[#7F56D9]'
                  : 'text-[#667085] hover:bg-[#F9FAFB]'
                }`}
            >
              <span className="text-[20px]">
                <HiOutlineCog />
              </span>
              Settings
            </Link>
            <NotificationBell />
          </div>

          <div className="pt-[24px] border-t border-[#F2F4F7] flex items-center justify-between group">
            <div className="flex items-center gap-[12px] overflow-hidden">
              <div className="w-[40px] h-[40px] rounded-full bg-[#F9F5FF] flex items-center justify-center text-[14px] font-bold text-[#7F56D9] overflow-hidden shrink-0 border border-[#F2F4F7]">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="overflow-hidden">
                <h5 className="text-[14px] font-bold text-[#101828] mb-0 truncate">{profile?.user_name ?? 'User'}</h5>
                <p className="text-[12px] text-[#667085] mb-0 truncate font-medium" title={user?.email}>{user?.email || 'Email'}</p>
              </div>
            </div>
            <button
              onClick={signout}
              className="text-[#667085] hover:text-[#7F56D9] transition-colors p-1 rounded-md hover:bg-[#F9F5FF] border-none bg-transparent cursor-pointer"
              title="Logout"
            >
              <HiOutlineLogout className="text-[20px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto pt-8 px-8 pb-12">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

