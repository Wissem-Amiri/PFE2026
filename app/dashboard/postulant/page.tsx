'use client'

import { SearchOutlined, BankOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Input } from 'antd'

export default function PostulantJobsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#101828]">Offres d&apos;emploi</h1>
        <p className="text-[#475467] text-sm mt-1">Découvrez les postes disponibles et postulez en un clic.</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-8 max-w-2xl">
        <Input
          prefix={<SearchOutlined className="text-[#98A2B3]" />}
          placeholder="Rechercher un poste, département..."
          size="large"
          className="rounded-xl"
          disabled
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {['Tous les postes', 'Informatique', 'Finance', 'Marketing', 'RH', 'Commercial'].map((f, i) => (
          <button
            key={f}
            disabled
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-not-allowed
              ${i === 0
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                : 'bg-white text-[#475467] border-[#E4E7EC] hover:border-[#7C3AED]'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        {/* Illustration */}
        <div className="relative mb-8">
          {/* Background circles */}
          <div className="w-32 h-32 rounded-full bg-[#EDE9FE]/40 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#EDE9FE] flex items-center justify-center">
              <BankOutlined className="text-[#7C3AED] text-4xl" />
            </div>
          </div>
          {/* Floating badges */}
          <div className="absolute -top-2 -right-6 bg-white border border-[#E4E7EC] rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
            <EnvironmentOutlined className="text-[#7C3AED] text-xs" />
            <span className="text-[11px] font-medium text-[#475467]">Remote</span>
          </div>
          <div className="absolute -bottom-2 -left-8 bg-white border border-[#E4E7EC] rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-1.5">
            <ClockCircleOutlined className="text-amber-500 text-xs" />
            <span className="text-[11px] font-medium text-[#475467]">Temps plein</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#101828] mb-2">
          Aucune offre pour le moment
        </h2>
        <p className="text-[#475467] text-sm max-w-xs leading-relaxed">
          Les offres d&apos;emploi publiées par l&apos;administrateur apparaîtront ici. Revenez bientôt !
        </p>

        {/* Skeleton cards preview (decorative) */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl opacity-30 pointer-events-none select-none">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#E4E7EC] p-5 text-left">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EDE9FE]" />
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="h-4 bg-slate-100 rounded-lg w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
