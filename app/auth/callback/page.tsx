'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/api/supabase'
import { Spin } from 'antd'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error in auth callback:', error.message)
        router.push('/login')
        return
      }
      
      if (data.session) {
        router.push('/')
      } else {
        router.push('/login')
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="flex flex-col h-screen items-center justify-center gap-4">
      <Spin size="large" />
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-800">Finalizing login...</h1>
        <p className="text-slate-500">You will be redirected in a moment.</p>
      </div>
    </div>
  )
}
