'use client'

import { ConfigProvider } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const PURPLE = '#7F56D9'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))
  const pathname = usePathname()
  
  // Only show the split-screen layout on /login and /auth/register
  const isSplitLayout = pathname === '/login' || pathname === '/auth/register'

  if (!isSplitLayout) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: PURPLE,
            fontFamily: "'Inter', sans-serif",
            borderRadius: 8,
            colorBorder: '#eaecf0',
            controlHeight: 44,
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: PURPLE,
          fontFamily: "'Inter', sans-serif",
          borderRadius: 8,
          colorBorder: '#eaecf0',
          controlHeight: 44,
        },
      }}
    >
      <div className="flex h-screen overflow-hidden font-['Inter',sans-serif]">
        {/* ── LEFT PANEL ── */}
        <div className="flex-1 flex flex-col justify-center py-6 px-14 bg-white min-w-0 overflow-hidden">
          {/* Logo */}
          <div className="mb-6 mt-10">
            <Link href="/" className=" -ml-7 inline-block">
              <img src="/assets/UnifyHR.png" alt="UnifyHR Logo" className="h-[140px] w-auto object-contain object-left" />
            </Link>

            {/* Page content (form, etc.) injected here */}
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-between text-[13px] text-slate-400">
            <span>© SoftyEducation</span>
            <span>✉ help@SoftyEducation.com</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-[48%] flex flex-col justify-center pt-32 p-14 relative overflow-hidden bg-[length:cover] bg-center bg-no-repeat" style={{ backgroundImage: "linear-gradient(135deg, rgba(15, 10, 30, 0.80) 0%, rgba(30, 15, 60, 0.70) 100%), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80')" }}>
          <div className="absolute bottom-12 left-8 w-[100px] h-[90px] border-[2.5px] border-[rgba(167,139,250,0.8)] border-t-0 border-r-0 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] -rotate-10" />
          <div className="text-white max-w-[420px]">
            <div className="yu-sparkle text-[22px] tracking-[4px] mb-[18px] opacity-90">✦ ✦✦</div>
            <h2 className="text-[38px] font-bold leading-[1.2] mb-4">Streamline your HR management</h2>
            <p className="text-[18px] opacity-80 leading-[1.6] mb-8">
              A powerful platform to manage employees, leaves, recruitment and
              AI-powered attendance — all in one place.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex">
                {['#C4B5FD', '#A78BFA', '#D4A574', '#C4B5FD'].map((c, i) => (
                  <span key={i} className="w-9 h-9 rounded-full border-[2.5px] border-white/80 -ml-2.5 inline-block" style={{ background: c }} />
                ))}
              </div>
              <p className="text-sm opacity-85">Join 40,000+ users</p>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
