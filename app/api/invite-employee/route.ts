import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, user_name, department, position, hire_date, monthly_rate } = await request.json()

    if (!email || !user_name) {
      return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Invite the user via Supabase Auth Admin
    // This will create the user in auth.users and trigger the "Invitation" template email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { user_name, role: 'employee' },
      redirectTo: `${new URL(request.url).origin}/auth/new-pass`
    })

    if (authError) {
      console.error('❌ Auth Invitation Error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const userId = authData.user.id

    // 2. Insert into public.users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        user_name,
        email,
        role: 'employee',
        status: 'approved'
      })

    if (userError) {
      console.error('❌ Users Insert Error:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // 3. Insert into public.employee
    const { error: empError } = await supabaseAdmin
      .from('employee')
      .upsert({
        id: userId,
        department,
        position,
        hire_date,
        monthly_rate,
        vacation_balance: 0
      })

    if (empError) {
      console.error('❌ Employee Insert Error:', empError)
      return NextResponse.json({ error: empError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId })
  } catch (err: any) {
    console.error('❌ Unexpected Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
