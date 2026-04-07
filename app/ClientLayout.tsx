'use client'

import { ConfigProvider } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PURPLE = '#7c3aed'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Only show the split-screen layout on /login and /auth/register
  const isSplitLayout = pathname === '/login' || pathname === '/auth/register'

  if (!isSplitLayout) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: PURPLE,
            fontFamily: "'Sora', sans-serif",
            borderRadius: 8,
            colorBorder: '#e2e8f0',
            controlHeight: 44,
          },
        }}
      >
        {children}
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: PURPLE,
          fontFamily: "'Sora', sans-serif",
          borderRadius: 8,
          colorBorder: '#e2e8f0',
          controlHeight: 44,
        },
      }}
    >
      <div className="auth-root">
        {/* ── LEFT PANEL ── */}
        <div className="auth-left">
          {/* Logo */}
          <div>
            <Link href="/" className="auth-logo" style={{ textDecoration: 'none' }}>
              Yunr
            </Link>

            {/* Page content (form, etc.) injected here */}
            {children}
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <span>© SoftyEducation</span>
            <span>✉ help@SoftyEducation.com</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right">
          <div className="auth-curl" />
          <div className="auth-overlay">
            <div className="yu-sparkle auth-sparkle">✦ ✦✦</div>
            <h2 className="auth-hero-title">Streamline your HR management</h2>
            <p className="auth-hero-desc">
              A powerful platform to manage employees, leaves, recruitment and
              AI-powered attendance — all in one place.
            </p>
            <div className="auth-avatar-row">
              <div className="auth-avatar-stack">
                {['#C4B5FD', '#A78BFA', '#D4A574', '#C4B5FD'].map((c, i) => (
                  <span key={i} className="auth-avatar-dot" style={{ background: c }} />
                ))}
              </div>
              <p className="auth-join-text">Join 40,000+ users</p>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}