"use client"

import { Session, User } from "@supabase/supabase-js";
import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "./supabase";
import { useRouter, usePathname } from "next/navigation";
import { Spin } from "antd";

type AuthContextType = {
  user: User | null | undefined
  session: Session | null | undefined
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>
  signout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>()
  const [user, setUser] = useState<User | null>()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.auth.getSession()
      if (!error) {
        setSession(data.session)
        setUser(data.session?.user || null)
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

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    router.push('/login')
  }

  const value = { user, session, isLoading, signIn, signUp: signup, signout }
  return (
    <AuthContext.Provider value={value}> {children} </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Whitelist all auth-related pages so they are accessible
    const isAuthPage = pathname === '/login' || pathname.startsWith('/auth/')
    
    if (user && isAuthPage) {
      router.push("/")
    }
  }, [user, pathname, router])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return <>{children}</>
}