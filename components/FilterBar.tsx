interface FilterBarProps {
  children: React.ReactNode
  className?: string
}

/**
 * A unified container for Search + Filter controls.
 * Wraps children in the standard dashboard filter bar style.
 */
export default function FilterBar({ children, className = '' }: FilterBarProps) {
  return (
    <div
      className={`bg-[rgba(248,248,248,0.31)] border border-[rgba(203,195,213,0.1)] rounded-[16px] p-4 mb-[16px] flex flex-col xl:flex-row items-center justify-between gap-4 h-auto ${className}`}
    >
      {children}
    </div>
  )
}
