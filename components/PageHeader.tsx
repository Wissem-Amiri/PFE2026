interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`bg-white border-b border-[#eaecf0] pt-6 md:pt-[40px] pb-[32px] px-4 md:px-[40px] ${className}`}>
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-[30px] font-semibold text-[#101828] tracking-tight m-0">{title}</h1>
          {description && (
            <p className="text-[16px] text-[#667085] font-normal m-0">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-3 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
