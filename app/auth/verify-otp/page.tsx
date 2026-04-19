'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/api/AuthContext'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Alert } from 'antd'
import CheckLayout from '@/CheckLayout'


const OTP_LENGTH = 8

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const { verifyOtp, resend } = useAuth()

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null))

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (value: string, idx: number) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1)
    const next = [...otp]
    next[idx] = char
    setOtp(next)
    if (char && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus()
      setActiveIdx(idx + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      const next = [...otp]
      if (otp[idx]) {
        next[idx] = ''
        setOtp(next)
      } else if (idx > 0) {
        next[idx - 1] = ''
        setOtp(next)
        inputRefs.current[idx - 1]?.focus()
        setActiveIdx(idx - 1)
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
      setActiveIdx(idx - 1)
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus()
      setActiveIdx(idx + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    setOtp(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
    setActiveIdx(focusIdx)
  }

  const handleVerify = async () => {
    const token = otp.join('')
    if (token.length < OTP_LENGTH) {
      setErrorMsg('Please enter all 8 digits.')
      return
    }
    setLoading(true)
    setErrorMsg('')

    const { error, data } = await verifyOtp({ email, token, type: 'signup' })
    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    const { data: profileData } = await import('@/api/profile').then(m => m.getProfile(data.user?.id ?? ''))
    const { getDashboardByRole } = await import('@/api/AuthContext')
    router.push(getDashboardByRole(profileData?.role))
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendMsg('')
    const { error } = await resend({ type: 'signup', email })
    setResendLoading(false)
    if (error) {
      setResendMsg(error.message)
    } else {
      setResendMsg('Verification email resent! Check your inbox.')
    }
  }

  return (
    <CheckLayout currentStep="verify-otp">

      {/* Envelope icon */}
      <div className="w-[72px] h-[72px] rounded-full bg-[#ede9fe] flex items-center justify-center mx-auto mb-7">
        <MailOutlined className="text-[30px] text-[#7c3aed]" />
      </div>

      {/* Title */}
      <h1 className="text-[24px] font-bold text-slate-900 mb-3 leading-snug">
        Type the code we sent you
      </h1>

      {/* Subtitle */}
      <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
        We sent a verification link to{' '}
        <span className="text-slate-900 font-semibold">{email || 'your email'}</span>
      </p>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 mb-8" onPaste={handlePaste}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={el => { inputRefs.current[idx] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(e.target.value, idx)}
            onKeyDown={e => handleKeyDown(e, idx)}
            onFocus={() => setActiveIdx(idx)}
            className={`w-[52px] h-[52px] text-[22px] font-semibold text-center rounded-[10px] bg-white outline-none transition-colors duration-150 cursor-text font-['Sora',sans-serif] ${idx === activeIdx ? 'border-2 border-dashed border-[#7c3aed]' : digit ? 'border-[1.5px] border-solid border-[#7c3aed] text-[#7c3aed]' : 'border-[1.5px] border-solid border-[#e2e8f0] text-slate-900'}`}
          />
        ))}
      </div>

      {/* Error / resend messages */}
      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon className="mb-4 rounded-lg text-left" />
      )}
      {resendMsg && (
        <Alert message={resendMsg} type="success" showIcon className="mb-4 rounded-lg text-left" />
      )}

      {/* Verify button */}
      <Button
        type="primary"
        block
        size="large"
        loading={loading}
        onClick={handleVerify}
        className="!bg-[#7c3aed] hover:!bg-[#6d28d9] !border-none font-semibold text-[15px] h-[44px] rounded-lg mb-5"
      >
        Verify email
      </Button>

      {/* Resend */}
      <p className="text-[13px] text-slate-500 mb-4">
        Didn&apos;t receive the email?{' '}
        <button
          onClick={handleResend}
          disabled={resendLoading}
          className="bg-transparent border-none cursor-pointer text-[#7c3aed] font-semibold text-[13px] font-inherit p-0"
        >
          {resendLoading ? 'Sending...' : 'Click to resend'}
        </button>
      </p>

      {/* Back to login */}
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[14px] text-slate-500 font-medium no-underline hover:text-[#7c3aed] transition-colors">
        <ArrowLeftOutlined className="text-[12px]" />
        Back to log in
      </Link>
    </CheckLayout>
  )
}
