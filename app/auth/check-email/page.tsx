'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MailOutlined, CheckCircleFilled, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Button, ConfigProvider } from 'antd'

const PURPLE = '#7c3aed'
const PURPLE_LIGHT = '#ede9fe'

/* ── Step data ──────────────────────────────────────────────── */
const STEPS = [
  {
    key: 'check',
    label: 'Check your email',
    desc: 'We sent a verification link to your email',
    status: 'done',
  },
  {
    key: 'verify',
    label: 'Verify Code',
    desc: 'Click the link in your email to verify',
    status: 'active',
  },
  {
    key: 'login',
    label: 'Continue to login',
    desc: 'Start collaborating with your team',
    status: 'pending',
  },
]

function StepIcon({ status }: { status: 'done' | 'active' | 'pending' }) {
  if (status === 'done') {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: '#fff', border: `2px solid ${PURPLE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircleFilled style={{ color: PURPLE, fontSize: 18 }} />
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: '#fff', border: `2px solid ${PURPLE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: PURPLE,
        }} />
      </div>
    )
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: '#fff', border: '2px solid #d1d5db',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#d1d5db' }} />
    </div>
  )
}

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? 'your email'

  return (
    <ConfigProvider
      theme={{ token: { colorPrimary: PURPLE, fontFamily: "'Sora', sans-serif" } }}
    >
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Sora', sans-serif" }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          width: 280,
          minWidth: 280,
          background: '#f8f7ff',
          borderRight: '1px solid #ede9fe',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 32px',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 56 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: PURPLE, letterSpacing: '-0.5px' }}>
              Yunr
            </span>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, idx) => (
              <div key={step.key} style={{ display: 'flex', gap: 14 }}>
                {/* Icon + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <StepIcon status={step.status as any} />
                  {idx < STEPS.length - 1 && (
                    <div style={{
                      width: 2,
                      flex: 1,
                      minHeight: 40,
                      background: step.status === 'done' ? PURPLE : '#e5e7eb',
                      margin: '4px 0',
                    }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ paddingBottom: idx < STEPS.length - 1 ? 32 : 0, paddingTop: 4 }}>
                  <p style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 14,
                    color: step.status === 'pending' ? '#9ca3af' : '#0f172a',
                  }}>
                    {step.label}
                  </p>
                  <p style={{
                    margin: '3px 0 0',
                    fontSize: 12,
                    color: step.status === 'active' ? PURPLE : '#9ca3af',
                    fontWeight: step.status === 'active' ? 500 : 400,
                  }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>© SoftyEducation</span>
            <span>✉ help@SoftyEducation.com</span>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          padding: '48px 32px',
        }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>

            {/* Icon */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: PURPLE_LIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 28px',
            }}>
              <MailOutlined style={{ fontSize: 30, color: PURPLE }} />
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 12px',
            }}>
              Check your email
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
              We sent a verification link to{' '}
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{email}</span>
            </p>

            {/* Enter code manually button */}
            <Link
              href={`/auth/verify-otp?email=${encodeURIComponent(email)}`}
              style={{ display: 'block', marginBottom: 20 }}
            >
              <Button
                type="primary"
                block
                size="large"
                className="!bg-[#7c3aed] hover:!bg-[#6d28d9] !border-none font-semibold text-[15px] h-[44px] rounded-lg"
              >
                Enter code manually
              </Button>
            </Link>

            {/* Back to login */}
            <Link
              href="/login"
              style={{
                fontSize: 14,
                color: '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: 12 }} />
              Back to log in
            </Link>
          </div>
        </main>
      </div>
    </ConfigProvider>
  )
}
