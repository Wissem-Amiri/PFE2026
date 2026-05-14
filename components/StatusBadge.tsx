type StatusType = 'pending' | 'accepted' | 'approved' | 'rejected' | 'open' | 'closed' | string

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<string, { bg: string; text: string; label?: string }> = {
  pending:    { bg: '#FFFAEB', text: '#B54708' },
  accepted:   { bg: '#ECFDF3', text: '#027A48' },
  approved:   { bg: '#ECFDF3', text: '#027A48' },
  rejected:   { bg: '#FEF2F2', text: '#B42318' },
  open:       { bg: '#ECFDF3', text: '#027A48' },
  closed:     { bg: '#FEF2F2', text: '#B91C1C' },
  interviewing: { bg: '#EFF8FF', text: '#026AA2' },
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase()
  const config = statusConfig[normalized] || { bg: '#F2F4F7', text: '#344054' }
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold leading-5 ${className}`}
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {label}
    </span>
  )
}
