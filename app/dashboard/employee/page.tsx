'use client'

import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Button } from 'antd'

export default function EmployeeDashboardPage() {
  const { profile, user } = useAuth()

  return (
    <div className="p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Bonjour, {profile?.user_name ?? user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Bienvenue dans votre espace employé.</p>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-md">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#ede9fe] flex items-center justify-center">
            <UserOutlined className="text-[#7c3aed] text-2xl" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{profile?.user_name || '—'}</p>
            <p className="text-sm text-slate-500">{profile?.position || 'Poste non défini'}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600 border-t border-slate-50 pt-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Département</span>
            <span className="font-medium">{profile?.department || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Téléphone</span>
            <span className="font-medium">{profile?.phone || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date d'embauche</span>
            <span className="font-medium">
              {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>
        </div>

        <Link href="/dashboard/employee/profile" className="block mt-5">
          <Button
            block
            icon={<ArrowRightOutlined />}
            className="!bg-[#7c3aed] !text-white !border-none rounded-lg font-semibold h-[40px]"
          >
            Modifier mon profil
          </Button>
        </Link>
      </div>
    </div>
  )
}
