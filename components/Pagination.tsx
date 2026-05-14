import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-3 py-2 border border-[#d0d5dd] rounded-[8px] text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <HiOutlineChevronLeft /> Previous
      </button>

      <div className="flex gap-[4px]">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`w-[40px] h-[40px] rounded-[8px] text-[14px] font-semibold transition-all ${
              currentPage === i + 1
                ? 'bg-[#f9f5ff] text-[#7f56d9] ring-1 ring-[#7f56d9]'
                : 'text-[#667085] hover:bg-gray-50'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-3 py-2 border border-[#d0d5dd] rounded-[8px] text-[14px] font-semibold text-[#344054] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next <HiOutlineChevronRight />
      </button>
    </div>
  )
}
