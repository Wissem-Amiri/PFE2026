import { HiOutlineCheck, HiOutlineX } from 'react-icons/hi'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type?: 'success' | 'danger' | 'warning'
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const typeConfig = {
  success: {
    iconBg: 'bg-[#ecfdf5] border border-[#abefc6]',
    icon: <HiOutlineCheck className="text-[#10b981] text-[32px]" />,
    confirmClass: 'bg-[#7f56d9] text-white hover:bg-[#6941c6] shadow-lg shadow-[#7f56d9]/20',
  },
  danger: {
    iconBg: 'bg-[#fef2f2] border border-[#fecaca]',
    icon: <HiOutlineX className="text-[#dc2626] text-[32px]" />,
    confirmClass: 'bg-[#d11010] text-white hover:bg-[#b91c1c] shadow-md shadow-red-100',
  },
  warning: {
    iconBg: 'bg-[#fffaeb] border border-[#fde68a]',
    icon: <HiOutlineCheck className="text-[#d97706] text-[32px]" />,
    confirmClass: 'bg-[#f59e0b] text-white hover:bg-[#d97706]',
  },
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'success',
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const config = typeConfig[type]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] p-10 w-full max-w-[500px] shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${config.iconBg}`}>
            {config.icon}
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>

          {description && (
            <div className="text-slate-500 mb-8 leading-relaxed">
              {description}
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 h-12 rounded-xl font-bold transition-all disabled:opacity-50 ${config.confirmClass}`}
            >
              {loading ? 'Loading...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
