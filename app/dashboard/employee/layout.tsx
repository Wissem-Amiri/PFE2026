'use client'

import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'

const navItems = [
  { href: '/dashboard/employee', label: 'Accueil', icon: <DashboardOutlined /> },
  { href: '/dashboard/employee/profile', label: 'Mon profil', icon: <UserOutlined /> },
]

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen font-['Sora',sans-serif] bg-[#f8f7ff]">

      {/* ── SIDEBAR ── */}
      <aside className="w-[260px] min-w-[260px] bg-white border-r border-slate-100 flex flex-col py-8 px-5 shadow-sm">

        {/* Logo */}
        <div className="mb-10 px-2">
          <span className="text-2xl font-extrabold text-[#7c3aed] tracking-tight">Yunr</span>
          <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Employé</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all no-underline
                  ${isActive
                    ? 'bg-[#ede9fe] text-[#7c3aed]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-slate-100 pt-5 mt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#ede9fe] flex items-center justify-center">
              <UserOutlined className="text-[#7c3aed]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{profile?.user_name ?? 'Employé'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            block
            icon={<LogoutOutlined />}
            onClick={signout}
            className="rounded-lg border-slate-200 text-slate-600 text-sm font-medium h-[38px]"
          >
            Se déconnecter
          </Button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
