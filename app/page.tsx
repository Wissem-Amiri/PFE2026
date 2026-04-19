'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/api/AuthContext'
import { Spin } from 'antd'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
    } else {
      const role = user.user_metadata?.role
      router.replace(role === 'admin' ? '/dashboard/admin' : '/dashboard/employee')
    }
  }, [user, isLoading, router])

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  )
}
