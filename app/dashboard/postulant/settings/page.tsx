'use client'

import { useState } from 'react'
import { useAuth } from '@/api/AuthContext'
import { Switch, Button, Divider, message } from 'antd'
import {
  BellOutlined,
  LockOutlined,
  MailOutlined,
  GlobalOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import Link from 'next/link'

export default function PostulantSettingsPage() {
  const { user, signout } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()

  const [notifs, setNotifs] = useState({
    email_new_offer: true,
    email_status: true,
    email_newsletter: false,
  })

  const handleToggle = (key: keyof typeof notifs) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
    messageApi.success('Préférence mise à jour')
  }

  return (
    <div>
      {contextHolder}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Paramètres</h1>
        <p className="text-[#475467] text-sm mt-1">Gérez vos préférences et la sécurité de votre compte.</p>
      </div>

      <div className="max-w-xl space-y-5">

        {/* ── Notifications ── */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F2F4F7] flex items-center gap-2">
            <BellOutlined className="text-[#7C3AED] text-base" />
            <span className="font-semibold text-[#101828] text-sm">Notifications</span>
          </div>

          <div className="divide-y divide-[#F2F4F7]">
            <SettingRow
              label="Nouvelles offres d'emploi"
              description="Recevoir un email quand une offre est publiée"
              checked={notifs.email_new_offer}
              onChange={() => handleToggle('email_new_offer')}
            />
            <SettingRow
              label="Statut de candidature"
              description="Être notifié des décisions sur votre dossier"
              checked={notifs.email_status}
              onChange={() => handleToggle('email_status')}
            />
            <SettingRow
              label="Newsletter Yunr"
              description="Conseils et actualités RH"
              checked={notifs.email_newsletter}
              onChange={() => handleToggle('email_newsletter')}
            />
          </div>
        </div>

        {/* ── Compte ── */}
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F2F4F7] flex items-center gap-2">
            <LockOutlined className="text-[#7C3AED] text-base" />
            <span className="font-semibold text-[#101828] text-sm">Compte &amp; Sécurité</span>
          </div>

          <div className="divide-y divide-[#F2F4F7]">
            {/* Email */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MailOutlined className="text-[#98A2B3]" />
                <div>
                  <p className="text-sm font-medium text-[#344054]">Email</p>
                  <p className="text-[12px] text-[#98A2B3]">{user?.email}</p>
                </div>
              </div>
              <span className="text-[11px] text-[#98A2B3] bg-slate-50 border border-[#E4E7EC] rounded-full px-2.5 py-1 font-medium">
                Vérifié
              </span>
            </div>

            {/* Change password */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LockOutlined className="text-[#98A2B3]" />
                <div>
                  <p className="text-sm font-medium text-[#344054]">Mot de passe</p>
                  <p className="text-[12px] text-[#98A2B3]">Modifiez votre mot de passe</p>
                </div>
              </div>
              <Link href="/auth/forgot-password">
                <Button
                  size="small"
                  className="rounded-lg border-[#D0D5DD] text-[#475467] text-[12px] font-medium"
                >
                  Modifier
                </Button>
              </Link>
            </div>

            {/* Language */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GlobalOutlined className="text-[#98A2B3]" />
                <div>
                  <p className="text-sm font-medium text-[#344054]">Langue</p>
                  <p className="text-[12px] text-[#98A2B3]">Français</p>
                </div>
              </div>
              <span className="text-[11px] text-[#98A2B3] bg-slate-50 border border-[#E4E7EC] rounded-full px-2.5 py-1 font-medium">
                FR
              </span>
            </div>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-50 flex items-center gap-2">
            <DeleteOutlined className="text-red-400 text-base" />
            <span className="font-semibold text-red-500 text-sm">Zone dangereuse</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#344054]">Se déconnecter</p>
              <p className="text-[12px] text-[#98A2B3]">Fermer la session en cours</p>
            </div>
            <Button
              danger
              size="small"
              onClick={signout}
              className="rounded-lg text-[12px] font-medium"
            >
              Déconnexion
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Row component ── */
function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#344054]">{label}</p>
        <p className="text-[12px] text-[#98A2B3]">{description}</p>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        style={{ backgroundColor: checked ? '#7C3AED' : undefined }}
      />
    </div>
  )
}
