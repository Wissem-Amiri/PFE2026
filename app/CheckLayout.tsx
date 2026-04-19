'use client'

import React from 'react'
import { ConfigProvider } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'

const PURPLE = '#7c3aed'

const OTP_STEPS = [
  { key: 'check-email', label: 'Check your email' },
  { key: 'verify-otp', label: 'Verify Code' },
  { key: 'login', label: 'Continue to login' },
]

const FORGOT_STEPS = [
  { key: 'forgot-password', label: 'Enter your Email' },
  { key: 'check-email-forgot', label: 'Check your email' },
  { key: 'new-pass', label: 'Set new password' },
  { key: 'dashboard', label: 'Continue to Dashboard' },
]

function StepIcon({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done') return (
    <div className="w-8 h-8 rounded-full bg-white border-2 border-[#7c3aed] flex items-center justify-center">
      <CheckCircleFilled className="text-[#7c3aed] text-lg" />
    </div>
  )
  if (status === 'active') return (
    <div className="w-8 h-8 rounded-full bg-white border-2 border-[#7c3aed] flex items-center justify-center">
      <div className="w-3.5 h-3.5 rounded-full bg-[#7c3aed]" />
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
    </div>
  )
}

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface CheckLayoutProps {
  children: React.ReactNode
  currentStep?: string // Kept for backwards compatibility but not used
}

export default function CheckLayout({ children }: CheckLayoutProps) {
  const pathname = usePathname()
  
  const isForgotFlow = pathname?.includes('/forgot-password') || pathname?.includes('/new-pass')
  const steps = isForgotFlow ? FORGOT_STEPS : OTP_STEPS

  const [activeKey, setActiveKey] = useState(isForgotFlow ? 'forgot-password' : 'check-email')

  useEffect(() => {
    if (pathname?.includes('/forgot-password')) {
      setActiveKey('forgot-password')
    } else if (pathname?.includes('/new-pass')) {
      setActiveKey('new-pass')
    } else if (pathname?.includes('/check-email')) {
      setActiveKey('check-email')
    } else if (pathname?.includes('/verify-otp')) {
      setActiveKey('verify-otp')
    } else if (pathname?.includes('/verify-email')) {
      setActiveKey('login')
    } else if (pathname?.includes('/login')) {
      setActiveKey('login')
    }
  }, [pathname])

  const currentIdx = steps.findIndex(s => s.key === activeKey)

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE, fontFamily: "'Sora', sans-serif" } }}>
      <div className="flex min-h-screen font-['Sora',sans-serif]">
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-[320px] min-w-[320px] bg-[#fcfcfd] border-r border-[#eaecf0] flex flex-col py-10 px-8 relative">
          <div className="mb-16">
            <span className="text-[28px] font-bold text-[#7c3aed] italic tracking-[-1px]">Yunr</span>
          </div>

          <div className="flex flex-col">
            {steps.map((step, idx) => {
              let status: 'done' | 'active' | 'pending' = 'pending'
              if (idx < currentIdx) status = 'done'
              else if (idx === currentIdx) status = 'active'
              else status = 'pending'

              return (
                <div key={step.key} className="flex gap-4 min-h-[72px]">
                  <div className="flex flex-col items-center">
                    <StepIcon status={status} />
                    {idx < steps.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1.5 ${status === 'done' ? 'bg-[#7c3aed]' : 'bg-[#eaecf0]'}`} />
                    )}
                  </div>
                  <div className="pt-1 pb-4">
                    <p className={`m-0 font-semibold text-[14px] leading-tight ${status === 'active' ? 'text-[#7c3aed]' : status === 'done' ? 'text-[#344054]' : 'text-[#667085]'}`}>
                      {step.label}
                    </p>
                    <p className={`m-0 text-[12px] mt-1 ${status === 'active' ? 'text-[#a78bfa]' : 'text-[#98a2b3]'}`}>
                      {idx === 0 ? 'Lorem Ipsum Lorem Ipsum' : idx === 1 ? 'Lorem Ipsum Lorem' : 'Start collaborating with your team'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex-1" />
          <div className="text-[11px] text-[#98a2b3] flex flex-row justify-between items-center w-full mt-8">
            <span>© SoftyEducation</span>
            <span>✉ help@SoftyEducation.com</span>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex items-center justify-center bg-white py-12 px-8">
          <div className="w-full max-w-[420px] text-center">
            {children}
          </div>
        </main>

      </div>
    </ConfigProvider>
  )
}
