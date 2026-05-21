'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getDashboardByRole } from '@/lib/auth'
import { getProfile } from '@/app/api/profile'
import { Form, Input, Button, Checkbox, Alert } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

/* ─── Validation Schema ────────────────────────────────────── */
const loginSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    remember: yup.boolean().default(false),
})

type LoginFormInputs = {
    email: string
    password: string
    remember: boolean
}


export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const applyTo = searchParams.get('applyTo')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const { signIn, signInWithOAuth } = useAuth()

    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
        resolver: yupResolver(loginSchema) as any,
        defaultValues: { email: '', password: '', remember: false },
    })

    const handleLogin = async (values: LoginFormInputs) => {
        setLoading(true)
        setErrorMsg('')
        const { data, error } = await signIn(values.email, values.password)
        if (error) { setErrorMsg(error.message); setLoading(false); return }

        // Read role from utilisateur table (source of truth)
        const { data: profile } = await getProfile(data.user?.id || '')
        const fallbackRole = data.user?.user_metadata?.role
        const role = profile?.role || fallbackRole
        
        const dashboardPath = getDashboardByRole(role)
        if (applyTo && (role === 'candidate' || !role)) {
            router.push(`${dashboardPath}/profile?applyTo=${applyTo}`)
        } else {
            router.push(dashboardPath)
        }
    }

    const handleGoogleLogin = async () => {
        const callbackUrl = `${window.location.origin}/auth/callback${applyTo ? `?applyTo=${applyTo}` : ''}`
        await signInWithOAuth('google', { redirectTo: callbackUrl })
    }

    return (
        <>
            <h1 className="text-[30px] font-bold text-slate-900 mb-1.5">Log in</h1>
            <p className="text-[15px] text-slate-500 mb-7">Welcome back! Please enter your details.</p>

            {errorMsg && (
                <Alert title={errorMsg} type="error" showIcon className="mb-5 rounded-lg" />
            )}

            <Form layout="vertical" onFinish={handleSubmit(handleLogin)} requiredMark={false}>
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
                            <Input {...field} prefix={<MailOutlined className="text-slate-400" />} placeholder="Enter your email" size="large" />
                        )}
                    />
                </Form.Item>

                {/* Password */}
                <Form.Item
                    label={<span className="font-medium text-gray-700">Password <span className="text-red-500">*</span></span>}
                    validateStatus={errors.password ? 'error' : ''}
                    help={errors.password?.message}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input.Password {...field} prefix={<LockOutlined className="text-slate-400" />} placeholder="••••••••" size="large" />
                        )}
                    />
                </Form.Item>

                {/* Remember + Forgot */}
                <div className="flex justify-between items-center mb-5">
                    <Form.Item noStyle>
                        <Controller
                            name="remember"
                            control={control}
                            render={({ field: { value, onChange, ...rest } }) => (
                                <Checkbox {...rest} checked={value} onChange={e => onChange(e.target.checked)} className="text-gray-700 text-sm">
                                    Remember for 30 days
                                </Checkbox>
                            )}
                        />
                    </Form.Item>
                    <Link href="/auth/forgot-password" className="text-sm text-[#7F56D9] font-medium no-underline">Forgot password</Link>
                </div>

                {/* Submit */}
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large"
                        className="!bg-[#7F56D9] hover:!bg-[#6d28d9] !border-none font-semibold text-[15px] h-[44px] rounded-lg">
                        Sign in
                    </Button>
                </Form.Item>
            </Form>

            {/* Google */}
            <Button block size="large" onClick={handleGoogleLogin}
                className="h-[44px] rounded-lg border-[1.5px] border-slate-200 font-medium text-[15px] text-slate-800 flex items-center justify-center gap-2.5 w-full">
                <GoogleIcon /> Sign in with Google
            </Button>

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href={`/auth/register${applyTo ? `?applyTo=${applyTo}` : ''}`} className="text-[#7F56D9] font-semibold">Sign up</Link>
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

