'use client'

import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function PostulantLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, signout } = useAuth()
  const pathname = usePathname()

  const fullName = profile?.user_name ?? user?.email?.split('@')[0] ?? 'Postulant'
  const initials = fullName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navLinks = [
    { href: '/dashboard/postulant', label: '💼 Offres d\'emploi', exact: true },
    { href: '/dashboard/postulant/candidature', label: '📄 Mes candidatures', exact: false },
    { href: '/dashboard/postulant/settings', label: '⚙️ Paramètres', exact: false },
  ]

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Sora',sans-serif]">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-[#E4E7EC] sticky top-0 z-50 h-16 flex items-center justify-between px-8">

        {/* Logo */}
        <Link
          href="/dashboard/postulant"
          className="no-underline text-[22px] font-bold text-[#7C3AED] italic tracking-[-1px]"
        >
          Yunr
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium no-underline transition-all
                ${isActive(link.href, link.exact)
                  ? 'bg-[#EDE9FE] text-[#7C3AED]'
                  : 'text-[#475467] hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {/* Profile link via avatar */}
          <Link href="/dashboard/postulant/profile" className="flex items-center gap-3 no-underline group">
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-xs font-bold select-none group-hover:ring-2 group-hover:ring-[#7C3AED]/30 transition-all">
              {initials}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[12px] font-semibold text-[#101828] group-hover:text-[#7C3AED] transition-colors">{fullName}</span>
              <span className="text-[10px] text-[#98A2B3] mt-0.5">Postulant</span>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={signout}
            className="px-3.5 py-1.5 rounded-lg border border-[#D0D5DD] text-[12px] font-medium text-[#475467] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {children}
      </main>

    </div>
  )
}
