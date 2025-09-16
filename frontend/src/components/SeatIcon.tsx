'use client'

import { Seat } from '@/utils/busSeats'

interface SeatIconProps {
  seat: Seat
  isSelected: boolean
  onClick?: () => void
  disabled?: boolean
  showLabel?: boolean
  isAdmin?: boolean
  isHighlighted?: boolean // For highlighting user's own seat in reservation history
}

export default function SeatIcon({
  seat,
  isSelected,
  onClick,
  disabled = false,
  showLabel = true,
  isAdmin = false,
  isHighlighted = false
}: SeatIconProps) {
  const getSeatColor = () => {
    if (isHighlighted) {
      return 'text-blue-600 bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-400'
    }
    if (seat.status === 'occupied') {
      return 'text-red-500 bg-red-100 dark:bg-red-900/30'
    }
    if (isSelected) {
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    }
    return 'text-green-600 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40'
  }

  const getSeatTitle = () => {
    if (isHighlighted) return `좌석 ${seat.id} - 내 예약 좌석`
    if (seat.status === 'occupied') return `좌석 ${seat.id} - 예약됨`
    if (isSelected) return `좌석 ${seat.id} - 선택됨`
    return `좌석 ${seat.id} - 예약 가능`
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled || (seat.status === 'occupied' && !isAdmin)}
        className={`
          relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg transition-all duration-200 cursor-pointer border-2
          ${getSeatColor()}
          ${disabled || (seat.status === 'occupied' && !isAdmin) ? 'cursor-not-allowed opacity-60' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          hover:scale-105 active:scale-95 touch-manipulation
          min-w-[32px] min-h-[32px] sm:min-w-[40px] sm:min-h-[40px]
        `}
        title={getSeatTitle()}
      >
        {/* 좌석 모양 - 의자 아이콘 */}
        <div className="absolute inset-1 flex flex-col">
          {/* 등받이 */}
          <div className="w-full h-2 bg-current rounded-t opacity-90 mb-0.5" />
          {/* 시트 */}
          <div className="w-full flex-1 bg-current rounded opacity-70" />
        </div>

        {/* 상태 표시 아이콘 */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {isHighlighted ? (
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          ) : isSelected ? (
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : seat.status === 'occupied' ? (
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 sm:w-3 sm:h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          ) : null}
        </div>
      </button>

      {showLabel && (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-4 sm:min-w-6 text-center">
          {seat.id}
        </span>
      )}
    </div>
  )
}