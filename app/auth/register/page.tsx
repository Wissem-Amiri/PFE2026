'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/api/AuthContext'
import { checkEmailExists } from '@/api/profile'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

/* ─── Validation Schema ────────────────────────────────────── */
const registerSchema = yup.object().shape({
  name: yup.string().trim().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().trim().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Must be at least 8 characters').required('Password is required'),
})

type RegisterFormInputs = yup.InferType<typeof registerSchema>



export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applyTo = searchParams.get('applyTo')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { signUp, signInWithOAuth } = useAuth()

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: yupResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const handleRegister = async (values: RegisterFormInputs) => {
    setLoading(true)
    setErrorMsg('')

    // Verify if email is already in use (by form or Google)
    const { exists, error: checkError } = await checkEmailExists(values.email)
    if (checkError) {
      setErrorMsg('Error checking email availability.')
      setLoading(false)
      return
    }

    if (exists) {
      setErrorMsg('This email is already registered. If you previously used Google, please log in with Google.')
      setLoading(false)
      return
    }

    const { error } = await signUp(values.email, values.password, {
      data: {
        full_name: values.name,
        role: 'candidat',
      },
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    // Redirect to verify-email page with the email as a query param
    const verifyUrl = `/auth/verify-email?email=${encodeURIComponent(values.email)}${applyTo ? `&applyTo=${applyTo}` : ''}`
    router.push(verifyUrl)
  }

  const handleGoogleSignup = async () => {
    const callbackUrl = `${window.location.origin}/auth/callback${applyTo ? `?applyTo=${applyTo}` : ''}`
    await signInWithOAuth('google', { redirectTo: callbackUrl })
  }

  return (
    <>
      <h1 className="text-[30px] font-bold text-slate-900 mb-1.5 mt-8">Sign up</h1>

      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon className="mb-5 rounded-lg" />
      )}

      <Form layout="vertical" onFinish={handleSubmit(handleRegister)} requiredMark={false}>

        {/* Name */}
        <Form.Item
          label={<span className="font-medium text-gray-700">Name <span className="text-red-500">*</span></span>}
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<UserOutlined className="text-slate-400" />}
                placeholder="Enter your name"
                size="large"
              />
            )}
          />
        </Form.Item>

        {/* Email */}
        <Form.Item
          label={<span className="font-medium text-gray-700">Email <span className="text-red-500">*</span></span>}
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="Enter your email"
                size="large"
              />
            )}
          />
        </Form.Item>

        {/* Password */}
        <Form.Item
          label={<span className="font-medium text-gray-700">Password <span className="text-red-500">*</span></span>}
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message ?? (
            <span className="text-slate-400 text-[13px]">Must be at least 8 characters.</span>
          )}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Create a password"
                size="large"
              />
            )}
          />
        </Form.Item>

        {/* Submit */}
        <Form.Item className="mt-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            className="!bg-[#7F56D9] hover:!bg-[#6d28d9] !border-none font-semibold text-[15px] h-[44px] rounded-lg"
          >
            Create account
          </Button>
        </Form.Item>
      </Form>

      {/* Google */}
      <Button
        block
        size="large"
        onClick={handleGoogleSignup}
        className="h-[44px] rounded-lg border-[1.5px] border-slate-200 font-medium text-[15px] text-slate-800 flex items-center justify-center gap-2.5 w-full"
      >
        <GoogleIcon /> Sign up with Google
      </Button>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href={`/login${applyTo ? `?applyTo=${applyTo}` : ''}`} className="text-[#7F56D9] font-semibold">Log in</Link>
      </p>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
