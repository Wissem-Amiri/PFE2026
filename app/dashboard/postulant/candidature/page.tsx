'use client'

import { useAuth } from '@/lib/AuthContext'
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import { useState, useEffect } from 'react'
import { getUserCandidatures } from '@/lib/candidatureService'

export default function PostulantCandidaturePage() {
  const { user } = useAuth()
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCandidatures() {
      if (user) {
        const { data } = await getUserCandidatures(user.id)
        setCandidatures(data ?? [])
      }
      setLoading(false)
    }
    loadCandidatures()
  }, [user])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return { label: 'Acceptée', color: 'success', icon: <CheckCircleOutlined /> }
      case 'rejected':
        return { label: 'Refusée', color: 'error', icon: <CloseCircleOutlined /> }
      default:
        return { label: 'En attente', color: 'warning', icon: <ClockCircleOutlined /> }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Mes candidatures</h1>
        <p className="text-[#475467] text-sm mt-1">Suivez l&apos;état de vos dossiers de candidature aux offres.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#475467]">Chargement de vos candidatures...</div>
      ) : candidatures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm p-6 text-center text-[#475467]">
          Vous n&apos;avez encore postulé à aucune offre d&apos;emploi.
        </div>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {candidatures.map((cand) => {
            const config = getStatusConfig(cand.status)
            return (
              <div key={cand.id} className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#101828] text-[16px] mb-1">{cand.job?.title || 'Offre supprimée'}</h3>
                  <div className="flex gap-2 items-center text-sm text-[#475467]">
                    <span className="font-medium">{cand.job?.category}</span>
                    <span>•</span>
                    <span>Postulé le {new Date(cand.applied_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                
                <div>
                  <Tag
                    color={config.color}
                    icon={config.icon}
                    className="text-[13px] px-3 py-1 rounded-lg font-semibold m-0"
                  >
                    {config.label}
                  </Tag>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
