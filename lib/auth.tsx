"use client"

import { Session, User } from "@supabase/supabase-js";
import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import { getProfile } from "@/app/api/profile";
import type { FullProfile } from "@/lib/database.types";


type AuthContextType = {
  user: User | null | undefined
  session: Session | null | undefined
  profile: FullProfile | null | undefined
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>
  signInWithOAuth: (provider: any, options?: any) => Promise<{ error: any; data: any }>
  signUp: (email: string, password: string, options?: any) => Promise<{ error: any; data: any }>
  verifyOtp: (params: any) => Promise<{ error: any; data: any }>
  resend: (params: any) => Promise<{ error: any; data: any }>
  resetPassword: (email: string) => Promise<{ error: any; data: any }>
  signout: () => Promise<void>
  updateUser: (attributes: any) => Promise<{ error: any; data: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>()
  const [user, setUser] = useState<User | null>()
  const [profile, setProfile] = useState<FullProfile | null>()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.auth.getSession()
      if (!error && data.session) {
        setSession(data.session)
        setUser(data.session.user)
        // Fetch profile from users table
        const { data: profileData } = await getProfile(data.session.user.id)
        setProfile(profileData)
      } else {
        setSession(null)
        setUser(null)
        setProfile(null)
      }
      setIsLoading(false)
    }

    checkSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkSession()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])


  const signUp = async (email: string, password: string, options?: any) => {
    const mergedOptions = {
      ...options,
      
      emailRedirectTo: `${window.location.origin}/auth/verify-email`,
    }
    console.log('options', options)
    const { data, error } = await supabase.auth.signUp({ email, password, options: mergedOptions })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signInWithOAuth = async (provider: any, options?: any) => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })
    return { data, error }
  }

  const verifyOtp = async (params: any) => {
    const { data, error } = await supabase.auth.verifyOtp(params)
    return { data, error }
  }

  const resend = async (params: any) => {
    const { data, error } = await supabase.auth.resend(params)
    return { data, error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/new-pass`,
    })
    return { data, error }
  }

  const signout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    router.push('/login')
  }

  const updateUser = async (attributes: any) => {
    const { data, error } = await supabase.auth.updateUser(attributes)
    return { data, error }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      const { data: profileData } = await getProfile(user.id)
      setProfile(profileData)
    }
  }

  const value = { user, session, profile, isLoading, signIn, signInWithOAuth, signUp, verifyOtp, resend, resetPassword, signout, updateUser, refreshProfile }
  return (
    <AuthContext.Provider value={value}> {children} </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

/** Returns the correct dashboard path based on role */
export function getDashboardByRole(role: string | null | undefined): string {
  if (role === 'admin') return '/dashboard/admin'
  if (role === 'employee') return '/dashboard/employee'
  return '/dashboard/candidate'
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const applyTo = searchParams.get('applyTo')

  useEffect(() => {
    if (isLoading) return

    const isAuthPage = pathname === '/login' || pathname.startsWith('/auth/')
    const isNewPassPage = pathname.startsWith('/auth/new-pass')
    const isVerifyEmailPage = pathname.startsWith('/auth/verify-email')
    const isHomePage = pathname === '/'
    const isDashboard = pathname.startsWith('/dashboard/')

    // If authenticated and on an auth page or home page (except new-pass & verify-email) → go to correct dashboard
    if (user && (isAuthPage || isHomePage) && !isNewPassPage && !isVerifyEmailPage) {
      const role = profile?.role || user.user_metadata?.role
      const dashboardPath = getDashboardByRole(role)

      if (applyTo && (role === 'candidate' || !role)) {
        router.push(`${dashboardPath}/apply/${applyTo}`)
      } else {
        router.push(dashboardPath)
      }
      return
    }

    // If not authenticated, not on auth page, not home → go to login
    if (!user && !isAuthPage && !isHomePage) {
      router.push('/login')
      return
    }

    // ── Role-based dashboard protection ──
    // Wait until profile is loaded before checking
    if (user && isDashboard && profile !== undefined) {

      const correctDashboard = getDashboardByRole(profile?.role || user.user_metadata?.role)

      // Redirect only if the user is NOT on their allowed dashboard path
      if (!pathname.startsWith(correctDashboard)) {
        router.push(correctDashboard)
        return
      }
    }
  }, [user, profile, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return <>{children}</>
}

