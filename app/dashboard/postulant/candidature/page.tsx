'use client'

import { useAuth } from '@/lib/AuthContext'
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

export default function PostulantCandidaturePage() {
  const { profile, user } = useAuth()

  const statusConfig = (() => {
    switch (profile?.status) {
      case 'approved':
        return {
          label: 'Approuvée', color: 'success' as const, icon: <CheckCircleOutlined />,
          description: 'Votre candidature a été acceptée. Félicitations !',
          bg: 'bg-emerald-50', text: 'text-emerald-700',
        }
      case 'rejected':
        return {
          label: 'Refusée', color: 'error' as const, icon: <CloseCircleOutlined />,
          description: "Votre candidature n'a pas été retenue pour ce poste.",
          bg: 'bg-red-50', text: 'text-red-700',
        }
      default:
        return {
          label: 'En attente', color: 'warning' as const, icon: <ClockCircleOutlined />,
          description: "Votre dossier est en cours d'examen. Vous serez notifié par email dès qu'une décision est prise.",
          bg: 'bg-amber-50', text: 'text-amber-700',
        }
    }
  })()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Mes candidatures</h1>
        <p className="text-[#475467] text-sm mt-1">Suivez l&apos;état de votre dossier de candidature.</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm p-6 max-w-lg">

        {/* Status */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-[#344054]">Statut de la candidature</p>
          <Tag
            color={statusConfig.color}
            icon={statusConfig.icon}
            className="text-[13px] px-3 py-1 rounded-lg font-semibold"
          >
            {statusConfig.label}
          </Tag>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm text-[#475467] border-t border-[#F2F4F7] pt-5">
          <div className="flex justify-between items-center">
            <span className="text-[#98A2B3]">Nom</span>
            <span className="font-medium text-[#101828]">{profile?.user_name || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#98A2B3]">Email</span>
            <span className="font-medium text-[#101828]">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#98A2B3]">Date d&apos;inscription</span>
            <span className="font-medium text-[#101828]">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('fr-FR')
                : '—'}
            </span>
          </div>
        </div>

        {/* Message */}
        <div className={`mt-6 rounded-xl px-4 py-3 text-sm leading-relaxed ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.description}
        </div>
      </div>
    </div>
  )
}
