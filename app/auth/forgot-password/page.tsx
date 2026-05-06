'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Form, Input, Button, Alert } from 'antd'
import { KeyOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import CheckLayout from '@/CheckLayout'


/* ─── Validation Schema ────────────────────────────────────── */



/* ─── Validation Schema ────────────────────────────────────── */
const forgotSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
})

type ForgotFormInputs = yup.InferType<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { resetPassword } = useAuth()

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotFormInputs>({
    resolver: yupResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const handleForgot = async (values: ForgotFormInputs) => {
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { error } = await resetPassword(values.email)

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setSuccessMsg('Instructions to reset your password have been sent to your email.')
  }

  return (
    <CheckLayout currentStep="email">

      {/* Key Icon */}
      <div className="w-[72px] h-[72px] rounded-full bg-[#ede9fe] flex items-center justify-center mx-auto mb-7">
        <KeyOutlined className="text-[30px] text-[#7c3aed]" />
      </div>

      {/* Title */}
      <h1 className="text-[30px] font-bold text-slate-900 mb-3 leading-snug">
        Forgot password?
      </h1>

      {/* Subtitle */}
      <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
        No worries, we'll send you reset instructions.
      </p>

      {/* Forms and Alerts */}
      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon className="mb-4 rounded-lg text-left" />
      )}
      {successMsg && (
        <Alert message={successMsg} type="success" showIcon className="mb-4 rounded-lg text-left" />
      )}

      <Form layout="vertical" onFinish={handleSubmit(handleForgot)} requiredMark={false} className="text-left">
        <Form.Item
          label={<span className="font-semibold text-slate-700">Email</span>}
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
          className="mb-8"
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Enter your email"
                size="large"
                className="h-11 rounded-lg"
              />
            )}
          />
        </Form.Item>

        <Form.Item className="mb-6">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!bg-[#7c3aed] hover:!bg-[#6d28d9] !border-none font-semibold text-[15px] h-[44px] rounded-lg"
          >
            Reset password
          </Button>
        </Form.Item>
      </Form>

      {/* Back to login */}
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 font-medium hover:text-[#7c3aed] transition-colors mt-2">
        <ArrowLeftOutlined className="text-xs" />
        Back to log in
      </Link>
    </CheckLayout>
  )
}
