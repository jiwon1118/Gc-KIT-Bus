'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import BusSeatLayout from '@/components/BusSeatLayout'
import { generateBusSeats, Seat, BusType } from '@/utils/busSeats'
import { busAPI, reservationAPI, Bus, Reservation } from '@/lib/api'

export default function UserDashboard() {
  const router = useRouter()
  const [buses, setBuses] = useState<Bus[]>([])
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [destinations, setDestinations] = useState<string[]>(['전체'])
  const [selectedDestination, setSelectedDestination] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Reload bus data when selected date changes
    const reloadBuses = async () => {
      try {
        const busesData = await busAPI.getAll(selectedDate)
        setBuses(busesData)

        // Extract unique destinations from buses
        const uniqueDestinations = ['전체', ...new Set(busesData.map(bus => bus.destination))]
        setDestinations(uniqueDestinations)
      } catch (error) {
        console.error('Failed to reload buses:', error)
      }
    }

    if (selectedDate) {
      reloadBuses()
    }
  }, [selectedDate])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 토큰이 없으면 로그인 페이지로 리다이렉트
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const busesData = await busAPI.getAll(selectedDate)
      setBuses(busesData)

      // Extract unique destinations from buses
      const uniqueDestinations = ['전체', ...new Set(busesData.map(bus => bus.destination))]
      setDestinations(uniqueDestinations)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError(`데이터를 불러오는데 실패했습니다: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    if (selectedBus) {
      loadBusSeats(selectedBus.id, selectedDate)
    }
  }, [selectedBus, selectedDate])

  const loadBusSeats = async (busId: number, reservationDate: string) => {
    try {
      const [seatsData] = await Promise.all([
        busAPI.getSeats(busId, reservationDate)
      ])

      const generatedSeats = generateBusSeats(selectedBus?.bus_type || '28-seat')

      // Mark reserved seats as occupied
      const updatedSeats = generatedSeats.map(seat => ({
        ...seat,
        status: (seatsData.reserved_seat_numbers.includes(seat.id) ? 'occupied' : 'available') as 'available' | 'occupied' | 'selected'
      }))

      setSelectedSeats(updatedSeats)
    } catch (error) {
      console.error('Failed to load seat data:', error)
      // Fallback to basic seat generation
      const fallbackSeats = generateBusSeats(selectedBus?.bus_type || '28-seat')
      setSelectedSeats(fallbackSeats)
    }
  }

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus)
    setSelectedSeatIds([])
  }

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatIds(prev => {
      const isCurrentlySelected = prev.includes(seatId)
      if (isCurrentlySelected) {
        // 좌석 선택 해제
        return prev.filter(id => id !== seatId)
      } else {
        // 좌석 선택 추가
        return [...prev, seatId]
      }
    })
  }

  const handleReservation = async () => {
    if (!selectedBus || selectedSeatIds.length === 0) return

    try {
      const newReservations = await reservationAPI.create({
        bus_id: selectedBus.id,
        seat_numbers: selectedSeatIds,
        reservation_date: selectedDate
      })

      alert(`${selectedSeatIds.length}개 좌석이 예약되었습니다!`)
      setSelectedSeatIds([])

      // Refresh bus data to get updated availability
      const updatedBuses = await busAPI.getAll(selectedDate)
      setBuses(updatedBuses)

      // Update selected bus with new data
      const updatedSelectedBus = updatedBuses.find(bus => bus.id === selectedBus.id)
      if (updatedSelectedBus) {
        setSelectedBus(updatedSelectedBus)
      }

    } catch (error) {
      console.error('Failed to create reservation:', error)
      alert('예약에 실패했습니다. 다시 시도해주세요.')
    }
  }



  const filteredBuses = selectedDestination === '전체'
    ? buses
    : buses.filter(bus => bus.destination === selectedDestination)


  if (loading) {
    return (
      <DashboardLayout
        userRole="user"
        title="버스 예약"
        subtitle="목적지별 버스를 조회하고 좌석을 예약하세요"
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
        userRole="user"
        title="버스 예약"
        subtitle="목적지별 버스를 조회하고 좌석을 예약하세요"
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
      userRole="user"
      title="버스 예약"
      subtitle="목적지별 버스를 조회하고 좌석을 예약하세요"
    >
      <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  버스 목록
                </h3>
                {selectedSeatIds.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      선택 중:
                    </span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-sm font-medium">
                      {selectedSeatIds.length}개 좌석
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    예약 날짜
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    목적지
                  </label>
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    {destinations.map((dest) => (
                      <option key={dest} value={dest}>{dest}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredBuses.map((bus) => (
                  <div
                    key={bus.id}
                    onClick={() => handleBusSelect(bus)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedBus?.id === bus.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{bus.bus_number}</h4>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            {bus.bus_type === '28-seat' ? '28인승' : '45인승'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{bus.route}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {bus.departure_time} - {bus.arrival_time}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          목적지: {bus.destination}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          잔여 {bus.available_seats}/{bus.total_seats}석
                        </div>
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            bus.occupancy_rate >= 90
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                              : bus.occupancy_rate >= 70
                              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                              : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          }`}>
                            {bus.occupancy_rate}% 예약됨
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 좌석 배치도 섹션 - 모바일 최적화 */}
          <div className="order-1 lg:order-2">
            {selectedBus ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    선택된 버스: {selectedBus.bus_number}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {selectedBus.route} • {selectedBus.departure_time}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      선택된 좌석 수:
                    </span>
                    <span className={`font-bold px-2 py-1 rounded ${
                      selectedSeatIds.length > 0
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {selectedSeatIds.length}개
                    </span>
                  </div>
                  {selectedSeatIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        선택한 좌석: <span className="font-medium text-blue-600 dark:text-blue-400">{selectedSeatIds.join(', ')}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <BusSeatLayout
                    seats={selectedSeats}
                    busType={selectedBus.bus_type}
                    onSeatSelect={handleSeatSelect}
                  />
                </div>

                {selectedSeatIds.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      선택한 좌석: <span className="font-semibold">{selectedSeatIds.join(', ')}</span>
                    </p>
                    <button
                      onClick={handleReservation}
                      className="w-full bg-primary-600 text-white px-4 py-3 rounded-md hover:bg-primary-700 transition-colors font-medium"
                    >
                      {selectedSeatIds.length}개 좌석 예약하기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                <div className="text-gray-400 text-4xl mb-3">🚌</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  버스를 선택하면 좌석 배치도가 표시됩니다
                </p>
              </div>
            )}
          </div>

      </div>
    </DashboardLayout>
  )
}