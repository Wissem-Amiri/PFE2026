'use client'
import { useAuth } from '@/api/AuthContext'
import Link from 'next/link'
import NotificationBell from '../../../components/NotificationBell'

import Image from 'next/image'
import { 
  HiOutlineCog, 
  HiOutlineLogout,
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineUserGroup
} from 'react-icons/hi'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard/employee', label: 'Home', icon: <HiOutlineHome />, badge: '10' },
  { href: '/dashboard/employee/registrations', label: 'Registrations', icon: <HiOutlineClipboardList /> },
  { href: '/dashboard/employee/employee-list', label: 'Employee', icon: <HiOutlineUserGroup /> },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()

  // Get initials for avatar
  const initials = profile?.user_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EM'

  return (
    <div className="flex min-h-screen font-['Inter',sans-serif] bg-white">

      {/* ── SIDEBAR (Figma Fidelity) ── */}
      <aside className="w-[243px] min-w-[243px] bg-[#FCFCFD] border-r border-[#EAECF0] flex flex-col h-screen sticky top-0 overflow-clip">

        {/* Logo Section (UnifyRH) */}
        <div className="pt-[32px] pb-[24px] pl-[16px]">
          <Link href="/dashboard/employee" className="block no-underline">
            <div className="flex items-center">
              <Image
                src="/assets/UnifyRH.png"
                alt="UnifyRH Logo"
                width={83}
                height={32}
                className="h-[32px] w-auto"
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
                <h5 className="text-[14px] font-bold text-[#101828] mb-0 truncate">{profile?.user_name ?? 'Farouck'}</h5>
                <p className="text-[12px] text-[#667085] mb-0 truncate font-medium" title={user?.email}>{user?.email || 'farouck@gmail.com'}</p>
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
        <div className="flex-1 overflow-y-auto pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}

