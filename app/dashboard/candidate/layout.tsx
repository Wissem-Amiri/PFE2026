'use client'

import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  HomeOutlined, 
  FileTextOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined 
} from '@ant-design/icons'
import { useState } from 'react'

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fullName = profile?.user_name ?? user?.email?.split('@')[0] ?? 'Candidate'
  const initials = fullName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navLinks = [
    { href: '/dashboard/candidate', label: 'Job Offers', icon: <HomeOutlined />, exact: true },
    { href: '/dashboard/candidate/applications', label: 'My Applications', icon: <FileTextOutlined />, exact: false },
  ]

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    await signout()
    router.push('/login')
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-['Inter',sans-serif] bg-[#F9FAFB]">
      {/* ── MOBILE HEADER ── */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#EAECF0] sticky top-0 z-[110]">
        <Link href="/dashboard/candidate" className="block no-underline">
          <img src="/assets/UnifyHR.png" alt="UnifyHR Logo" className="h-[80px] w-auto object-contain -ml-4" />
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 border-none bg-transparent cursor-pointer"
        >
          {mobileMenuOpen ? <CloseOutlined className="text-xl" /> : <MenuOutlined className="text-xl" />}
        </button>
      </div>

      {/* ── MOBILE OVERLAY ── */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-[100] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-[105] w-[243px] min-w-[243px] bg-white border-r border-[#EAECF0] flex flex-col h-screen transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo Section */}
        <div className="pt-[32px] pb-[10px] hidden lg:flex justify-center">
          <Link href="/dashboard/candidate" className="no-underline flex items-center justify-center group w-full">
            <img src="/assets/UnifyHR.png" alt="UnifyHR Logo" className="h-[130px] w-auto object-contain group-hover:scale-105 transition-transform -mt-[42px] -mb-8" />
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-[24px] pt-[140px] lg:pt-[30px] overflow-y-auto overflow-x-hidden">
          <nav className="flex flex-col gap-[4px]">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-[12px] px-[12px] h-[40px] rounded-[8px] text-[14px] font-medium no-underline transition-all
                  ${isActive(link.href, link.exact)
                    ? 'bg-[#F9F5FF] text-[#7C3AED]'
                    : 'text-[#344054] hover:bg-[#F9FAFB] hover:text-[#101828]'
                  }`}
              >
                <span className={`text-[15px] shrink-0 ${isActive(link.href, link.exact) ? 'text-[#7C3AED]' : 'text-[#667085]'}`}>
                  {link.icon}
                </span>
                <span className="truncate whitespace-nowrap">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* User Footer Section */}
        <div className="mt-auto border-t border-[#EAECF0] pt-[24px] pb-[24px] px-[24px] flex flex-col gap-[16px]">
          <div className="flex items-center gap-[12px]">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-[40px] h-[40px] rounded-full object-cover border border-[#DDD6FE] shadow-sm"
              />
            ) : (
              <div className="w-[40px] h-[40px] rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-[13px] font-bold border border-[#DDD6FE] shadow-sm">
                {initials}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-semibold text-[#101828] truncate leading-tight">{fullName}</span>
              <span className="text-[12px] text-[#475467] truncate leading-tight mt-0.5">{user?.email}</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-[12px] px-[12px] h-[40px] w-full rounded-[8px] text-[14px] font-bold text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] transition-all border-none bg-transparent cursor-pointer"
          >
            <LogoutOutlined className="text-[18px] shrink-0" />
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto bg-[#F9FAFB] px-4 md:px-8 pt-6 md:pt-8 pb-12">
        <div className="w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}
