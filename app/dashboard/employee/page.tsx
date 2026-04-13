'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import { UserOutlined, ArrowRightOutlined, CalendarOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Statistic, Spin } from 'antd'
import { getMyLeaves } from '@/lib/congeService'

export default function EmployeeDashboardPage() {
  const { profile, user } = useAuth()
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      getMyLeaves(user.id).then(({ data }) => {
        setLeaves(data ?? [])
        setLoading(false)
      })
    }
  }, [user?.id])

  const approvedLeaves = leaves.filter(l => l.status === 'approved').length
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length
  const totalDays = 25 // Default yearly balance

  return (
    <div className="p-[28px] max-w-[1200px] mx-auto">
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
          Welcome back, {profile?.user_name?.split(' ')[0] ?? user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-slate-500 text-[14px]">Here's what's happening with your workspace today.</p>
      </div>

      <Row gutter={[20, 20]} className="mb-8">
        {/* Leaves Remaining */}
        <Col xs={24} sm={8}>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 text-lg">
                <CalendarOutlined />
              </div>
              <span className="text-slate-300 text-lg">⋯</span>
            </div>
            <div className="text-[12px] font-semibold text-slate-500 mb-1">Leaves remaining</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-slate-900">{totalDays - approvedLeaves}</span>
              <span className="text-slate-400 text-sm">/ {totalDays} days</span>
            </div>
          </div>
        </Col>

        {/* Hours spent */}
        <Col xs={24} sm={8}>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-lg">
                <ClockCircleOutlined />
              </div>
              <span className="text-slate-300 text-lg">⋯</span>
            </div>
            <div className="text-[12px] font-semibold text-slate-500 mb-1">Hours spent (Monthly)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-slate-900">142</span>
              <span className="text-slate-400 text-sm">hours</span>
            </div>
          </div>
        </Col>

        {/* Pending Requests */}
        <Col xs={24} sm={8}>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 text-lg">
                <StarOutlined />
              </div>
              <span className="text-slate-300 text-lg">⋯</span>
            </div>
            <div className="text-[12px] font-semibold text-slate-500 mb-1">Pending leave requests</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-slate-900">{pendingLeaves}</span>
              <span className="text-slate-400 text-sm">requests</span>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Profile Details Card */}
        <Col xs={24} lg={12}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 h-full">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-[#ede9fe] flex items-center justify-center border-4 border-[#f5f3ff]">
                <UserOutlined className="text-[#7c3aed] text-3xl" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 m-0">{profile?.user_name || '—'}</h3>
                <p className="text-purple-600 font-semibold text-sm">{profile?.position || 'Employee'}</p>
                <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full w-fit uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-50 pt-6 mt-2">
              <div className="flex justify-between items-center group cursor-default">
                <span className="text-slate-400 text-[13px] font-medium">Email address</span>
                <span className="text-slate-700 font-semibold text-[13px]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center group cursor-default">
                <span className="text-slate-400 text-[13px] font-medium">Department</span>
                <span className="text-slate-700 font-semibold text-[13px]">{profile?.department || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between items-center group cursor-default">
                <span className="text-slate-400 text-[13px] font-medium">Hiring Date</span>
                <span className="text-slate-700 font-semibold text-[13px]">
                  {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center group cursor-default">
                <span className="text-slate-400 text-[13px] font-medium">Monthly Rate</span>
                <span className="text-purple-700 font-bold text-[14px]">
                  {/* @ts-expect-error adding custom field */}
                  {profile?.monthly_rate ? `${profile.monthly_rate.toLocaleString()} TND` : '—'}
                </span>
              </div>
            </div>

            <Link href="/dashboard/employee/profile" className="block mt-10">
              <Button
                block
                className="!h-[48px] !rounded-xl !border-slate-200 !text-slate-700 font-bold hover:!border-purple-600 hover:!text-purple-600 shadow-sm flex items-center justify-center gap-2"
              >
                View profile <ArrowRightOutlined className="text-[12px]" />
              </Button>
            </Link>
          </div>
        </Col>

        {/* Quick Actions / Shortcut */}
        <Col xs={24} lg={12}>
          <div className="bg-[#7c3aed] rounded-2xl p-8 h-full relative overflow-hidden flex flex-col justify-between shadow-xl shadow-purple-100">
            {/* Abstract Shapes */}
            <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-50px] left-[-30px] w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl mb-6 backdrop-blur-md">
                <StarOutlined />
              </div>
              <h2 className="text-white text-[22px] font-bold mb-3">Planning a break?</h2>
              <p className="text-purple-100 text-[14px] leading-relaxed max-w-[280px]">
                Submit your leave requests quickly and track their approval status in real-time.
              </p>
            </div>

            <Link href="/dashboard/employee/leaves" className="relative z-10">
              <button className="px-8 py-[12px] bg-white text-[#7c3aed] rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-all flex items-center gap-3">
                Manage Leaves <ArrowRightOutlined />
              </button>
            </Link>
          </div>
        </Col>
      </Row>
    </div>
  )
}

