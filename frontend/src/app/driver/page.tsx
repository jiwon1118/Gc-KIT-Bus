'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { busAPI, reservationAPI, Bus, Reservation } from '@/lib/api'
import { generateBusSeats } from '@/utils/busSeats'

export default function DriverDashboard() {
  const [assignedBuses, setAssignedBuses] = useState<Bus[]>([])
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [checkedPassengers, setCheckedPassengers] = useState<Set<number>>(new Set())
  const router = useRouter()


  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (selectedBus) {
      loadReservations(selectedBus.id)
    }
  }, [selectedBus, selectedDate])

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus)
    setCheckedPassengers(new Set()) // 버스 변경시 체크 상태 리셋
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // 기사에게 배정된 모든 버스 정보 가져오기
      const buses = await busAPI.getMyBuses()
      setAssignedBuses(buses)

      // 첫 번째 버스를 기본 선택
      if (buses.length > 0 && !selectedBus) {
        setSelectedBus(buses[0])
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('No buses assigned')) {
        setError('배정된 버스가 없습니다. 관리자에게 문의하세요.')
      } else {
        setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadReservations = async (busId: number) => {
    try {
      // 해당 버스의 예약 목록 가져오기
      const allReservations = await reservationAPI.getAll()
      const busReservations = allReservations.filter(r =>
        r.bus_id === busId &&
        r.reservation_date === selectedDate &&
        r.status === 'confirmed'
      )

      setReservations(busReservations)
    } catch (error) {
      console.error('Failed to load reservations:', error)
      setReservations([])
    }
  }

  const handlePassengerCheck = (reservationId: number) => {
    setCheckedPassengers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reservationId)) {
        newSet.delete(reservationId)
      } else {
        newSet.add(reservationId)
      }
      return newSet
    })
  }


  // 좌석맵 생성 함수
  const renderSeatMap = (reservedSeats: string[]) => {
    if (!selectedBus) return null

    const seats = generateBusSeats(selectedBus.bus_type)

    // 예약된 좌석 표시
    const seatMap = seats.map(seat => ({
      ...seat,
      status: reservedSeats.includes(seat.id) ? 'occupied' : 'available'
    }))

    const maxRow = Math.max(...seatMap.map(s => s.row))
    const rows = []
    const is28Seat = selectedBus.bus_type === '28-seat'

    for (let row = 1; row <= maxRow; row++) {
      const rowSeats = seatMap.filter(s => s.row === row).sort((a, b) => a.col - b.col)

      if (rowSeats.length === 0) continue

      const isLastRow = row === maxRow
      const is45SeatLastRow = isLastRow && selectedBus.bus_type === '45-seat'
      const is28SeatLastRow = isLastRow && selectedBus.bus_type === '28-seat'

      if (is45SeatLastRow) {
        // 45인승 마지막 열: 5명 좌석
        rows.push(
          <div key={row} className="flex items-center justify-center gap-3 mb-4 p-2">
            <div className="w-8 text-xs text-gray-600 dark:text-gray-300 text-center font-medium bg-orange-100 dark:bg-orange-900 rounded py-1">
              {row}
            </div>
            <div className="flex gap-3">
              {rowSeats.map(seat => (
                <div
                  key={seat.id}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium border-2 ${
                    seat.status === 'occupied'
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {seat.id}
                </div>
              ))}
            </div>
          </div>
        )
      } else if (is28SeatLastRow) {
        // 28인승 마지막 열: 4명 좌석
        rows.push(
          <div key={row} className="flex items-center justify-center gap-3 mb-4 p-2">
            <div className="w-8 text-xs text-gray-600 dark:text-gray-300 text-center font-medium bg-purple-100 dark:bg-purple-900 rounded py-1">
              {row}
            </div>
            <div className="flex gap-3">
              {rowSeats.map(seat => (
                <div
                  key={seat.id}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium border-2 ${
                    seat.status === 'occupied'
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {seat.id}
                </div>
              ))}
            </div>
          </div>
        )
      } else {
        // 일반 행: 2-1 또는 2-2 배치
        rows.push(
          <div key={row} className="flex items-center justify-center gap-3 mb-4 p-2">
            <div className="w-8 text-xs text-gray-600 dark:text-gray-300 text-center font-medium bg-gray-100 dark:bg-gray-700 rounded py-1">
              {row}
            </div>

            {/* 왼쪽 좌석들 */}
            <div className="flex gap-3">
              {rowSeats
                .filter(seat => seat.col <= 2)
                .map(seat => (
                  <div
                    key={seat.id}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium border-2 ${
                      seat.status === 'occupied'
                        ? 'bg-red-500 text-white border-red-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {seat.id}
                  </div>
                ))}
            </div>

            {/* 통로 */}
            <div className="w-10 border-l-2 border-r-2 border-gray-300 dark:border-gray-600 border-dashed h-12 flex items-center justify-center text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-400">🚶</span>
            </div>

            {/* 오른쪽 좌석들 */}
            <div className="flex gap-3">
              {rowSeats
                .filter(seat => seat.col > 2)
                .map(seat => (
                  <div
                    key={seat.id}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium border-2 ${
                      seat.status === 'occupied'
                        ? 'bg-red-500 text-white border-red-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {seat.id}
                  </div>
                ))}
            </div>
          </div>
        )
      }
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="mb-6 text-center">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            버스 좌석 배치도
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-full inline-block">
            {selectedBus.bus_type === '28-seat' ? '총 28석 (2-1 배치)' : '총 45석 (2-2 배치)'}
          </div>
        </div>

        <div className="relative">
          {/* 운전석 */}
          <div className="flex items-center justify-center gap-3 mb-3 p-2">
            <div className="w-8"></div>
            <div className="flex gap-2">
              <div className="w-12 h-12"></div>
            </div>
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 min-w-[70px] justify-center">
              <span>🚗</span>
              운전석
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-12"></div>
            </div>
            <div className="w-8"></div>
            <div className="flex gap-2">
              <div className="w-12 h-12"></div>
              {selectedBus.bus_type === '45-seat' && (
                <div className="w-12 h-12"></div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            {rows}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">예약 가능</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 border-2 border-red-600 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">예약됨</span>
          </div>
        </div>
      </div>
    )
  }

  const reservedSeatNumbers = reservations.map(r => r.seat_number)
  const occupancyRate = selectedBus ? (reservations.length / selectedBus.total_seats) * 100 : 0

  if (loading) {
    return (
      <DashboardLayout
        userRole="driver"
        title="기사 대시보드"
        subtitle={selectedBus ? `${selectedBus.bus_number} 운행 정보` : "버스를 선택하세요"}
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">데이터를 불러오는 중...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        userRole="driver"
        title="기사 대시보드"
        subtitle="오류가 발생했습니다"
      >
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => loadData()}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            다시 시도
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole="driver"
      title="기사 대시보드"
      subtitle={selectedBus ? `${selectedBus.bus_number} 운행 정보` : "버스를 선택하세요"}
    >
      <div className="space-y-6">
        {/* 버스 선택 드롭다운 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              운행 버스 선택
            </h3>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                예약 날짜:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          <select
            value={selectedBus?.id || ''}
            onChange={(e) => {
              const busId = parseInt(e.target.value)
              const bus = assignedBuses.find(b => b.id === busId)
              if (bus) handleBusSelect(bus)
            }}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">버스를 선택하세요</option>
            {assignedBuses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.bus_number} - {bus.route} ({bus.bus_type})
              </option>
            ))}
          </select>
        </div>

        {/* 버스 정보 카드 */}
        {selectedBus ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">🚌</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          버스 번호
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {selectedBus.bus_number}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          탑승 승객 수
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {reservations.length}명 / {selectedBus?.total_seats}석
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        occupancyRate >= 90 ? 'bg-red-500' :
                        occupancyRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        <span className="text-white text-sm">📊</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          탑승률
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {occupancyRate.toFixed(1)}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 운행 시간 정보 */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                운행 시간표
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">출발</div>
                    <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{selectedBus?.departure_time}</div>
                  </div>
                  <div className="text-blue-500 text-2xl">🚀</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <div className="text-sm text-green-600 dark:text-green-400">도착</div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-300">{selectedBus?.arrival_time}</div>
                  </div>
                  <div className="text-green-500 text-2xl">🏁</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  목적지: {selectedBus?.destination}
                </span>
              </div>
            </div>

            {/* 좌석 배치도 */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                좌석 배치도 및 승객 현황
              </h3>
              {renderSeatMap(reservedSeatNumbers)}
            </div>

            {/* 승객 목록 */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  승객 목록 ({reservations.length}명)
                </h3>
              </div>

              {reservations.length > 0 ? (
                <>
                  <div className="p-4">
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">총 탑승객:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{reservations.length}명</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600 dark:text-gray-400">탑승 확인:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{checkedPassengers.size}명</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          탑승 진행률: {reservations.length > 0 ? Math.round((checkedPassengers.size / reservations.length) * 100) : 0}%
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${reservations.length > 0 ? (checkedPassengers.size / reservations.length) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {reservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className={`p-3 border rounded-lg transition-colors ${
                            checkedPassengers.has(reservation.id)
                              ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {reservation.full_name || '이름 없음'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                좌석: {reservation.seat_number} | 전화: {reservation.phone || '번호 없음'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={checkedPassengers.has(reservation.id)}
                                onChange={() => handlePassengerCheck(reservation.id)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {checkedPassengers.has(reservation.id) ? '탑승 완료' : '미탑승'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {selectedDate}에는 예약된 승객이 없습니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚌</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              버스를 선택하세요
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              위에서 운행할 버스를 선택하면 승객 정보와 좌석 현황을 확인할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}