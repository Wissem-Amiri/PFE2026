interface Tab {
  label: string
  count?: number
}

interface TabSwitcherProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tab: string) => void
  variant?: 'underline' | 'pill'
  className?: string
}

export default function TabSwitcher({ tabs, activeTab, onTabChange, variant = 'underline', className = '' }: TabSwitcherProps) {
  if (variant === 'pill') {
    return (
      <div className={`flex flex-wrap bg-white p-[2px] rounded-[8px] border border-[#D0D5DD] shadow-sm w-full xl:w-auto ${className}`}>
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => onTabChange(tab.label)}
            className={`px-[16px] py-[10px] text-[14px] font-semibold rounded-[6px] transition-all border-0 cursor-pointer ${
              activeTab === tab.label
                ? 'bg-[#F9FAFB] text-[#344054]'
                : 'bg-white text-[#344054] hover:bg-[#F9FAFB]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 text-[12px] px-2 py-0.5 rounded-full ${
                activeTab === tab.label ? 'bg-[#7f56d9] text-white' : 'bg-[#F2F4F7] text-[#667085]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  // underline variant (default, used in Jobs page)
  return (
    <div className={`relative border-b border-[#EAECF0] w-full ${className}`}>
      <div className="flex gap-8 overflow-x-auto no-scrollbar w-full">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => onTabChange(tab.label)}
            className={`pb-4 px-1 text-[14px] font-semibold relative transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.label ? 'text-[#6941C6]' : 'text-[#667085] hover:text-[#101828]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.label ? 'bg-[#F9F5FF] text-[#6941C6]' : 'bg-[#F2F4F7] text-[#667085]'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.label && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6941C6] rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
