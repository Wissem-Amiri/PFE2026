interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  return (
    <div className={`flex-1 w-full xl:max-w-[550px] relative ${className}`}>
      <div className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[15px] h-[15px]">
        <img src="/assets/search.svg" alt="" className="w-full h-full opacity-60" />
      </div>
      <input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-[rgba(203,195,213,0.2)] rounded-[12px] pl-[41px] pr-[17px] py-[12px] text-[14px] text-[#101828] focus:outline-none focus:ring-1 focus:ring-[#7f56d9]/20 transition-all placeholder:text-[#6b7280]"
      />
    </div>
  )
}
