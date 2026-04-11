'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Alert } from 'antd'
import { KeyOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import CheckLayout from '@/CheckLayout'
import { supabase } from '@/lib/supabase'

/* ─── Validation Schema ────────────────────────────────────── */
const newPassSchema = yup.object().shape({
  password: yup.string().min(8, 'Must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
})

type NewPassFormInputs = yup.InferType<typeof newPassSchema>

export default function NewPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { control, handleSubmit, formState: { errors } } = useForm<NewPassFormInputs>({
    resolver: yupResolver(newPassSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  // Since useAuth doesn't expose an updatePassword explicitly for logged in state from magic link,
  // we can use supabase directly or update the AuthContext later. We use supabase directly here.
  const handleUpdate = async (values: NewPassFormInputs) => {
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { error } = await supabase.auth.updateUser({
      password: values.password
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setSuccessMsg('Your password has been changed successfully.')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  return (
    <CheckLayout currentStep="reset">
      {/* Key Icon */}
      <div className="w-[72px] h-[72px] rounded-full bg-[#ede9fe] flex items-center justify-center mx-auto mb-7">
        <KeyOutlined className="text-[30px] text-[#7c3aed]" />
      </div>

      {/* Title */}
      <h1 className="text-[30px] font-bold text-slate-900 mb-3 leading-snug">
        Set new password
      </h1>

      {/* Subtitle */}
      <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
        Your new password must be different to previously used passwords.
      </p>

      {/* Forms and Alerts */}
      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon className="mb-4 rounded-lg text-left" />
      )}
      {successMsg && (
        <Alert message={successMsg} type="success" showIcon className="mb-4 rounded-lg text-left" />
      )}

      <Form layout="vertical" onFinish={handleSubmit(handleUpdate)} requiredMark={false} className="text-left">
        <Form.Item
          label={<span className="font-semibold text-slate-700">Password</span>}
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message || <span className="text-gray-400 text-xs">Must be at least 8 characters.</span>}
          className="mb-5"
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder="••••••••"
                size="large"
                className="h-11 rounded-lg"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-slate-700">Confirm password</span>}
          validateStatus={errors.confirmPassword ? 'error' : ''}
          help={errors.confirmPassword?.message}
          className="mb-8"
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder="••••••••"
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
