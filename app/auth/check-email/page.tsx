'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import CheckLayout from '@/app/CheckLayout'


export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? 'your email'

  return (
    <CheckLayout currentStep="check">

            {/* Icon */}
            <div className="w-[72px] h-[72px] rounded-full bg-[#ede9fe] flex items-center justify-center mx-auto mb-7">
              <MailOutlined className="text-[30px] text-[#7c3aed]" />
            </div>

            {/* Title */}
            <h1 className="text-[26px] font-bold text-slate-900 mb-3 leading-snug">
              Check your email
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
              We sent a verification link to{' '}
              <span className="text-slate-900 font-semibold">{email}</span>
            </p>

            {/* Enter code manually button */}
            <Link
              href={`/auth/verify-otp?email=${encodeURIComponent(email)}`}
              className="block mb-5"
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
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 font-medium hover:text-[#7c3aed] transition-colors">
              <ArrowLeftOutlined className="text-xs" />
              Back to log in
            </Link>
    </CheckLayout>
  )
}
