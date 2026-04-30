'use client'

import { useState } from 'react'
import { useAuth } from '@/api/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineBriefcase,
  HiOutlineVideoCamera,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX
} from 'react-icons/hi'
import { Avatar } from 'antd'
import NotificationBell from '../../../components/NotificationBell'

import { useLeaves, useCandidatures } from '@/api/hooks'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { data: leavesData } = useLeaves()
  const { data: candidaturesData } = useCandidatures()

  const totalLeaves = leavesData?.count || 0
  const totalRegistrations = candidaturesData?.count || 0
  const totalActivities = totalLeaves + totalRegistrations

  const navItems = [
    { 
      href: '/dashboard/admin', 
      label: 'Home', 
      icon: HiOutlineHome, 
      badge: totalActivities > 0 ? totalActivities.toString() : undefined
    },
    { 
      href: '/dashboard/admin/registrations', 
      label: 'Registrations', 
      icon: HiOutlineClipboardList,
      badge: totalRegistrations > 0 ? totalRegistrations.toString() : undefined
    },
    { 
      href: '/dashboard/admin/leaves', 
      label: 'Leaves', 
      icon: HiOutlineCalendar,
      badge: totalLeaves > 0 ? totalLeaves.toString() : undefined
    },
    { href: '/dashboard/admin/employee', label: 'Employee', icon: HiOutlineUsers },
    { href: '/dashboard/admin/jobs', label: 'Jobs', icon: HiOutlineBriefcase },
    { href: '/dashboard/admin/recordings', label: 'Recordings', icon: HiOutlineVideoCamera },
  ]

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-['Inter',sans-serif] bg-[#fcfcfd]">
      
      {/* ── MOBILE HEADER ── */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#eaecf0] sticky top-0 z-40">
        <img src="/assets/UnifyRH.png" alt="UnifyRH Logo" className="h-[40px] w-auto object-contain" />
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

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[243px] min-w-[243px] bg-[#fcfcfd] border-r border-[#eaecf0] flex flex-col h-screen transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="pt-[10px] pb-[10px] px-[10px]">
          <img src="/assets/UnifyRH.png" alt="UnifyRH Logo" className="h-[110px] w-auto object-contain" />
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
                    ? 'bg-[#f9f5ff] text-[#7f56d9]'
                    : 'text-[#667085] hover:bg-[#f9fafb] hover:text-[#101828]'
                  } `}
              >
                <item.icon className={`w-[24px] h-[24px] ${isActive ? 'text-[#7f56d9]' : 'text-[#667085]'}`} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-[#f9f5ff] text-[#7f56d9] text-[12px] font-bold px-[10px] py-[2px] rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pb-[32px] px-[16px] flex flex-col gap-[8px]">
          
          <div className="flex items-center justify-between pr-[8px]">
             <Link 
               href="/dashboard/admin/settings?tab=account"
               className="flex-1 flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-[16px] font-medium text-[#667085] hover:bg-[#f9fafb] cursor-pointer no-underline" 
             >
              <HiOutlineCog className="w-[24px] h-[24px] text-[#667085]" />
              Settings
            </Link>
            <NotificationBell />
          </div>

          <div className="h-px bg-[#eaecf0] w-full my-2" />

          {/* User Profile Row */}
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
              className="bg-transparent border-none p-2 cursor-pointer hover:bg-slate-50 rounded-lg flex items-center justify-center transition-all text-[#667085] hover:text-[#344054]"
            >
              <HiOutlineLogout className="w-[24px] h-[24px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto bg-white lg:rounded-tl-[40px] shadow-[-10px_0_30px_rgba(0,0,0,0.02)] min-w-0">
        {children}
      </main>
    </div>
  )
}



