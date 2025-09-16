'use client'

import { useState } from 'react'
import { Seat, BusType } from '@/utils/busSeats'
import SeatIcon from './SeatIcon'

interface BusSeatLayoutProps {
  seats: Seat[]
  busType: BusType
  onSeatSelect?: (seatId: string) => void
  isDriver?: boolean
  isAdmin?: boolean
  selectedSeats?: string[]
  highlightSeats?: string[] // Seats to highlight with special color (for reservation history)
}

export default function BusSeatLayout({ seats, busType, onSeatSelect, isDriver = false, isAdmin = false, selectedSeats: externalSelectedSeats, highlightSeats = [] }: BusSeatLayoutProps) {
  const [internalSelectedSeats, setInternalSelectedSeats] = useState<string[]>([])

  // 외부에서 제공된 selectedSeats가 있으면 그것을 사용, 없으면 내부 state 사용
  const selectedSeats = externalSelectedSeats !== undefined ? externalSelectedSeats : internalSelectedSeats

  const handleSeatClick = (seat: Seat) => {
    // 기사 모드에서는 모든 좌석 클릭 비활성화
    if (isDriver) return

    // 일반 사용자 모드에서는 예약된 좌석 클릭 비활성화
    if (seat.status === 'occupied' && !isAdmin) return

    // 외부 selectedSeats가 제공되지 않은 경우에만 내부 상태 업데이트
    if (externalSelectedSeats === undefined) {
      const newSelectedSeats = selectedSeats.includes(seat.id)
        ? selectedSeats.filter(id => id !== seat.id)
        : [...selectedSeats, seat.id]
      setInternalSelectedSeats(newSelectedSeats)
    }

    // 외부 onSeatSelect 콜백 호출 (관리자 페이지에서 상태 관리)
    onSeatSelect?.(seat.id)
  }


  const renderSeatGrid = () => {
    const maxRow = Math.max(...seats.map(s => s.row))
    const rows = []
    const is28Seat = busType === '28-seat'

    for (let row = 1; row <= maxRow; row++) {
      const rowSeats = seats.filter(s => s.row === row).sort((a, b) => a.col - b.col)

      if (rowSeats.length === 0) continue

      const maxRow = Math.max(...seats.map(s => s.row))
      const isLastRow = row === maxRow // 마지막 열 여부
      const is45SeatLastRow = isLastRow && busType === '45-seat' // 45인승 마지막 열
      const is28SeatLastRow = isLastRow && busType === '28-seat' // 28인승 마지막 열

      if (is45SeatLastRow) {
        // 45인승 마지막 열: 5명 좌석 (통로에도 좌석)
        rows.push(
          <div key={row} className="flex items-center justify-center gap-3 sm:gap-4 mb-4 p-2">
            {/* 좌석 번호 표시 */}
            <div className="w-8 text-xs text-gray-600 dark:text-gray-300 text-center font-medium bg-orange-100 dark:bg-orange-900 rounded py-1">
              {row}
            </div>

            {/* 5명 좌석을 모두 나열 */}
            <div className="flex gap-3 sm:gap-4">
              {rowSeats.map(seat => (
                <SeatIcon
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeats.includes(seat.id)}
                  onClick={() => handleSeatClick(seat)}
                  disabled={isDriver}
                  showLabel={true}
                  isAdmin={isAdmin}
                  isHighlighted={highlightSeats.includes(seat.id)}
                />
              ))}
            </div>
          </div>
        )
      } else if (is28SeatLastRow) {
        // 28인승 마지막 열: 4명 좌석 (통로에도 좌석)
        rows.push(
          <div key={row} className="flex items-center justify-center gap-3 sm:gap-4 mb-4 p-2">
            {/* 좌석 번호 표시 */}
            <div className="w-8 text-xs text-gray-600 dark:text-gray-300 text-center font-medium bg-purple-100 dark:bg-purple-900 rounded py-1">
              {row}
            </div>

            {/* 4명 좌석을 모두 나열 */}
            <div className="flex gap-3 sm:gap-4">
              {rowSeats.map(seat => (
                <SeatIcon
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeats.includes(seat.id)}
                  onClick={() => handleSeatClick(seat)}
                  disabled={isDriver}
                  showLabel={true}
                  isAdmin={isAdmin}
                  isHighlighted={highlightSeats.includes(seat.id)}
                />
              ))}
            </div>
          </div>
        )
      } else {
        // 일반 행: 2-1 또는 2-2 배치
        rows.push(
          <div key={row} className="flex items-center justify-center gap-3 sm:gap-4 md:gap-3 mb-4 p-2">
            {/* 좌석 번호 표시 */}
            <div className="w-8 text-xs text-gray-600 dark:text-gray-300 text-center font-medium bg-gray-100 dark:bg-gray-700 rounded py-1">
              {row}
            </div>

            {/* 왼쪽 좌석들 (col 1, 2) */}
            <div className="flex gap-3 sm:gap-4">
              {rowSeats
                .filter(seat => seat.col <= 2)
                .map(seat => (
                  <SeatIcon
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.includes(seat.id)}
                    onClick={() => handleSeatClick(seat)}
                    disabled={isDriver}
                    showLabel={true}
                    isAdmin={isAdmin}
                    isHighlighted={highlightSeats.includes(seat.id)}
                  />
                ))
              }
            </div>

            {/* 통로 */}
            <div className="w-10 sm:w-12 border-l-2 border-r-2 border-gray-300 dark:border-gray-600 border-dashed h-12 flex items-center justify-center text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-400">🚶</span>
            </div>

            {/* 오른쪽 좌석들 (col 4, 5) */}
            <div className="flex gap-3 sm:gap-4">
              {rowSeats
                .filter(seat => seat.col > 2)
                .map(seat => (
                  <SeatIcon
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.includes(seat.id)}
                    onClick={() => handleSeatClick(seat)}
                    disabled={isDriver}
                    showLabel={true}
                    isAdmin={isAdmin}
                    isHighlighted={highlightSeats.includes(seat.id)}
                  />
                ))
              }
            </div>
          </div>
        )
      }
    }

    return rows
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700 min-w-fit">
      <div className="mb-6 text-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          버스 좌석 배치도
        </h3>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-full inline-block">
          {busType === '28-seat'
            ? '총 28석 (2-1 배치)'
            : '총 45석 (2-2 배치)'
          }
        </div>
      </div>

      <div className="relative">
        {/* 운전석을 1열 바로 위 1번 2번 사이에 배치 */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-3 mb-3 p-2">
          {/* 좌석 번호 공간 (빈 공간) */}
          <div className="w-8"></div>

          {/* 왼쪽 좌석들 공간 - 1번 좌석 위치 */}
          <div className="flex gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14"></div>
          </div>

          {/* 운전석 (1번과 2번 사이) */}
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 min-w-[70px] justify-center">
            <span>🚗</span>
            운전석
          </div>

          {/* 2번 좌석 위치 */}
          <div className="flex gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14"></div>
          </div>

          {/* 통로 공간 */}
          <div className="w-8 sm:w-10"></div>

          {/* 오른쪽 좌석들 공간 */}
          <div className="flex gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14"></div>
            {busType === '45-seat' && (
              <div className="w-12 h-12 sm:w-14 sm:h-14"></div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2">
          {renderSeatGrid()}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <SeatIcon
            seat={{ id: '', row: 0, col: 0, status: 'available' }}
            isSelected={false}
            disabled={true}
            showLabel={false}
            isAdmin={isAdmin}
            isHighlighted={false}
          />
          <span className="text-gray-700 dark:text-gray-300">예약 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <SeatIcon
            seat={{ id: '', row: 0, col: 0, status: 'occupied' }}
            isSelected={false}
            disabled={true}
            showLabel={false}
            isAdmin={isAdmin}
            isHighlighted={false}
          />
          <span className="text-gray-700 dark:text-gray-300">예약됨</span>
        </div>
        <div className="flex items-center gap-2">
          <SeatIcon
            seat={{ id: '', row: 0, col: 0, status: 'available' }}
            isSelected={true}
            disabled={true}
            showLabel={false}
            isAdmin={isAdmin}
            isHighlighted={false}
          />
          <span className="text-gray-700 dark:text-gray-300">선택됨</span>
        </div>
        <div className="flex items-center gap-2">
          <SeatIcon
            seat={{ id: '', row: 0, col: 0, status: 'available' }}
            isSelected={false}
            disabled={true}
            showLabel={false}
            isAdmin={isAdmin}
            isHighlighted={true}
          />
          <span className="text-gray-700 dark:text-gray-300">내 좌석</span>
        </div>
      </div>

      {!isDriver && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              좌석 선택 현황
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              selectedSeats.length > 0
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}>
              {selectedSeats.length}개 선택됨
            </span>
          </div>
          {selectedSeats.length > 0 ? (
            <p className="text-sm text-blue-700 dark:text-blue-300">
              선택한 좌석: <span className="font-semibold">{selectedSeats.join(', ')}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              좌석을 선택해주세요
            </p>
          )}
        </div>
      )}
    </div>
  )
}

