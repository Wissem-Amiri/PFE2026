'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MailOutlined, CheckCircleFilled, ArrowLeftOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Alert } from 'antd'

const PURPLE = '#7c3aed'
const PURPLE_LIGHT = '#ede9fe'

const STEPS = [
  { key: 'check', label: 'Check your email', desc: 'We sent a verification link to your email', status: 'done' },
  { key: 'verify', label: 'Verify Code', desc: 'Click the link in your email to verify', status: 'active' },
  { key: 'login', label: 'Continue to login', desc: 'Start collaborating with your team', status: 'pending' },
]

function StepIcon({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done') return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: `2px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CheckCircleFilled style={{ color: PURPLE, fontSize: 18 }} />
    </div>
  )
  if (status === 'active') return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: `2px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: PURPLE }} />
    </div>
  )
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#d1d5db' }} />
    </div>
  )
}

const OTP_LENGTH = 8

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null))

  // Auto-focus first input on mount
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

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    router.push('/')
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendMsg('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    if (error) {
      setResendMsg(error.message)
    } else {
      setResendMsg('Verification email resent! Check your inbox.')
    }
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: PURPLE, fontFamily: "'Sora', sans-serif" } }}>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Sora', sans-serif" }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{ width: 280, minWidth: 280, background: '#f8f7ff', borderRight: '1px solid #ede9fe', display: 'flex', flexDirection: 'column', padding: '40px 32px' }}>
          <div style={{ marginBottom: 56 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: PURPLE, letterSpacing: '-0.5px' }}>Yunr</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, idx) => (
              <div key={step.key} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <StepIcon status={step.status as any} />
                  {idx < STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 40, background: step.status === 'done' ? PURPLE : '#e5e7eb', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: idx < STEPS.length - 1 ? 32 : 0, paddingTop: 4 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: step.status === 'pending' ? '#9ca3af' : '#0f172a' }}>
                    {step.label}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: step.status === 'active' ? PURPLE : '#9ca3af', fontWeight: step.status === 'active' ? 500 : 400 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>© SoftyEducation</span>
            <span>✉ help@SoftyEducation.com</span>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '48px 32px' }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>

            {/* Envelope icon */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
              <MailOutlined style={{ fontSize: 30, color: PURPLE }} />
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>
              Type the code we sent you
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
              We sent a verification link to{' '}
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{email || 'your email'}</span>
            </p>

            {/* OTP Inputs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }} onPaste={handlePaste}>
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
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 22,
                    fontWeight: 600,
                    textAlign: 'center',
                    borderRadius: 10,
                    border: idx === activeIdx
                      ? `2px dashed ${PURPLE}`
                      : `1.5px solid ${digit ? PURPLE : '#e2e8f0'}`,
                    color: digit ? PURPLE : '#0f172a',
                    background: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    fontFamily: "'Sora', sans-serif",
                    cursor: 'text',
                  }}
                />
              ))}
            </div>

            {/* Error / resend messages */}
            {errorMsg && (
              <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8, textAlign: 'left' }} />
            )}
            {resendMsg && (
              <Alert message={resendMsg} type="success" showIcon style={{ marginBottom: 16, borderRadius: 8, textAlign: 'left' }} />
            )}

            {/* Verify button */}
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={handleVerify}
              className="!bg-[#7c3aed] hover:!bg-[#6d28d9] !border-none font-semibold text-[15px] h-[44px] rounded-lg"
              style={{ marginBottom: 20 }}
            >
              Verify email
            </Button>

            {/* Resend */}
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Didn&apos;t receive the email?{' '}
              <button
                onClick={handleResend}
                disabled={resendLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontWeight: 600, fontSize: 13, fontFamily: 'inherit', padding: 0 }}
              >
                {resendLoading ? 'Sending...' : 'Click to resend'}
              </button>
            </p>

            {/* Back to login */}
            <Link href="/login" style={{ fontSize: 14, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 500 }}>
              <ArrowLeftOutlined style={{ fontSize: 12 }} />
              Back to log in
            </Link>
          </div>
        </main>
      </div>
    </ConfigProvider>
  )
}
