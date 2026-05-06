'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import CheckLayout from '@/app/CheckLayout'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getDashboardByRole } from '@/lib/auth'
import { getProfile } from '@/app/api/profile'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? 'your email'
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    setLoading(true)

    // Get the current session
    const { data } = await supabase.auth.getSession()
    const session = data?.session

    if (session?.user) {
      // Read role from DB (source of truth) to route correctly for all roles
      const { data: profile } = await getProfile(session.user.id)
      router.push(getDashboardByRole(profile?.role))
    } else {
      // No session yet (user hasn't clicked email link), go to login
      router.push('/login')
    }
  }

  return (
    <CheckLayout currentStep="check-email">
      {/* Icon */}
      <div className="w-[48px] h-[48px] rounded-full bg-[#f3f0ff] flex items-center justify-center mx-auto mb-6">
        <MailOutlined className="text-[24px] text-[#7c3aed]" />
      </div>

      {/* Title */}
      <h1 className="text-[24px] font-bold text-[#101828] mb-3">
        Check your email
      </h1>

      {/* Subtitle */}
      <p className="text-[14px] text-[#667085] mb-8 leading-relaxed">
        We sent a verification link to <br />
        <span className="font-semibold">{email}</span>
      </p>

      {/* Action Button */}
      <Button
        type="primary"
        block
        size="large"
        onClick={() => router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`)}
        className="!bg-[#7c3aed] hover:!bg-[#6d28d9] !border-none font-semibold text-[14px] h-[44px] rounded-lg mb-6"
      >
        Enter code manually
      </Button>

      {/* Back to login */}
      <Link href="/login" className="inline-flex items-center gap-2 text-[14px] text-[#667085] font-medium hover:text-[#7c3aed] transition-colors">
        <ArrowLeftOutlined className="text-[12px]" /> Back to log in
      </Link>
    </CheckLayout>
  )
}

