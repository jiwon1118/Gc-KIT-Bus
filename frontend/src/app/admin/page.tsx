'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import BusSeatLayout from '@/components/BusSeatLayout'
import { generateBusSeats, Seat, BusType } from '@/utils/busSeats'
import { busAPI, reservationAPI, adminAPI, userAPI, Bus, Reservation } from '@/lib/api'

interface DashboardStats {
  total_users: number
  total_buses: number
  total_routes: number
  today_reservations: number
}

interface BusSchedule {
  id: number
  bus_number: string
  route: string
  departure_time: string
  destination: string
  driver_name?: string
  bus_type: BusType
  total_seats: number
  reserved_seats: number
  occupancy_rate: number
}

interface NewScheduleForm {
  bus_number: string
  route: string
  departure_time: string
  departure_date: string
  destination: string
  driver_name: string
  bus_type: BusType
}

interface User {
  id: number
  username: string
  full_name: string
  email?: string
  phone?: string
  role: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_buses: 0,
    total_routes: 0,
    today_reservations: 0
  })
  const [schedules, setSchedules] = useState<BusSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showNewScheduleForm, setShowNewScheduleForm] = useState(false)
  const [newSchedule, setNewSchedule] = useState<NewScheduleForm>({
    bus_number: '',
    route: '',
    departure_time: '',
    departure_date: new Date().toISOString().split('T')[0],
    destination: '',
    driver_name: '',
    bus_type: '28-seat'
  })
  const [selectedBusSeats, setSelectedBusSeats] = useState<Seat[]>(generateBusSeats('28-seat'))
  const [selectedBusForSeats, setSelectedBusForSeats] = useState<BusSchedule | null>(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [showDirectReservationModal, setShowDirectReservationModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    loadData()
    loadUsers()
  }, [selectedDate])

  useEffect(() => {
    if (schedules.length > 0 && !selectedBusForSeats) {
      setSelectedBusForSeats(schedules[0])
    }
  }, [schedules, selectedBusForSeats])

  const loadUsers = async () => {
    try {
      const usersData = await adminAPI.getAllUsers()
      setUsers(usersData.filter(user => user.role !== 'admin')) // 관리자 제외
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [busesData, reservationsData, statsData] = await Promise.all([
        busAPI.getAll(selectedDate),
        reservationAPI.getAll(),
        adminAPI.getStats()
      ])

      // 대시보드 통계 업데이트
      setStats(statsData)

      // 각 버스별 예약 수 계산
      const schedulesData = busesData.map((bus: Bus) => {
        const busReservations = reservationsData.filter((r: Reservation) =>
          r.bus_id === bus.id &&
          r.reservation_date === selectedDate &&
          r.status === 'confirmed'
        )
        const reservedSeats = busReservations.length
        const occupancyRate = bus.total_seats > 0 ? Math.round((reservedSeats / bus.total_seats) * 100) : 0

        return {
          id: bus.id,
          bus_number: bus.bus_number,
          route: bus.route,
          departure_time: bus.departure_time,
          destination: bus.destination,
          driver_name: '기사님', // 임시
          bus_type: bus.bus_type,
          total_seats: bus.total_seats,
          reserved_seats: reservedSeats,
          occupancy_rate: occupancyRate
        }
      })

      setSchedules(schedulesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadBusSeats = async () => {
      if (selectedBusForSeats) {
        try {
          // Get seat data from API
          const seatsData = await busAPI.getSeats(selectedBusForSeats.id, selectedDate)
          const generatedSeats = generateBusSeats(selectedBusForSeats.bus_type)

          // Mark reserved seats as occupied
          const updatedSeats = generatedSeats.map(seat => ({
            ...seat,
            status: seatsData.reserved_seat_numbers.includes(seat.id) ? 'occupied' : 'available'
          }))

          setSelectedBusSeats(updatedSeats)
        } catch (error) {
          console.error('Failed to load bus seat data:', error)
          // Fallback to basic seat generation
          const fallbackSeats = generateBusSeats(selectedBusForSeats.bus_type)
          setSelectedBusSeats(fallbackSeats)
        }
      }
    }

    loadBusSeats()
  }, [selectedBusForSeats, selectedDate])

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeatIds(prev => {
      const isCurrentlySelected = prev.includes(seatId)
      if (isCurrentlySelected) {
        return prev.filter(id => id !== seatId)
      } else {
        return [...prev, seatId]
      }
    })
  }

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    const totalSeats = newSchedule.bus_type === '28-seat' ? 28 : 45
    const newBusSchedule: BusSchedule = {
      id: schedules.length + 1,
      ...newSchedule,
      total_seats: totalSeats,
      reserved_seats: 0,
      occupancy_rate: 0
    }
    setSchedules([...schedules, newBusSchedule])
    setNewSchedule({
      bus_number: '',
      route: '',
      departure_time: '',
      departure_date: new Date().toISOString().split('T')[0],
      destination: '',
      driver_name: '',
      bus_type: '28-seat'
    })
    setShowNewScheduleForm(false)
  }

  const handleDeleteSchedule = (id: number) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id))
  }

  const handleCancelSelectedReservations = async () => {
    if (!selectedBusForSeats || selectedSeatIds.length === 0) {
      alert('취소할 좌석을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedSeatIds.length}개 좌석의 예약을 취소하시겠습니까?`)) {
      return
    }

    try {
      const allReservations = await reservationAPI.getAll()

      for (const seatId of selectedSeatIds) {
        const reservation = allReservations.find(r =>
          r.bus_id === selectedBusForSeats.id &&
          r.seat_number === seatId &&
          r.reservation_date === selectedDate &&
          r.status === 'confirmed'
        )

        if (reservation) {
          await reservationAPI.cancel(reservation.id)
        }
      }

      alert(`${selectedSeatIds.length}개 좌석의 예약이 취소되었습니다.`)
      setSelectedSeatIds([])

      // 데이터 새로고침
      await loadData()
      // 좌석 데이터 새로고침
      const seatsData = await busAPI.getSeats(selectedBusForSeats.id, selectedDate)
      const generatedSeats = generateBusSeats(selectedBusForSeats.bus_type)
      const updatedSeats = generatedSeats.map(seat => ({
        ...seat,
        status: seatsData.reserved_seat_numbers.includes(seat.id) ? 'occupied' : 'available'
      }))
      setSelectedBusSeats(updatedSeats)

    } catch (error) {
      alert(error instanceof Error ? error.message : '예약 취소에 실패했습니다.')
    }
  }

  const handleDirectReservation = () => {
    if (!selectedBusForSeats || selectedSeatIds.length === 0) {
      alert('예약할 좌석을 선택해주세요.')
      return
    }
    setShowDirectReservationModal(true)
  }

  const confirmDirectReservation = async () => {
    if (!selectedUser || !selectedBusForSeats || selectedSeatIds.length === 0) {
      alert('사용자와 좌석을 모두 선택해주세요.')
      return
    }

    try {
      await adminAPI.createDirectReservation({
        user_id: selectedUser.id,
        bus_id: selectedBusForSeats.id,
        seat_numbers: selectedSeatIds
      })

      alert(`${selectedUser.full_name}님을 위해 ${selectedSeatIds.length}개 좌석이 예약되었습니다.`)
      setSelectedSeatIds([])
      setSelectedUser(null)
      setShowDirectReservationModal(false)

      // 데이터 새로고침
      await loadData()
      // 좌석 데이터 새로고침
      const seatsData = await busAPI.getSeats(selectedBusForSeats.id, selectedDate)
      const generatedSeats = generateBusSeats(selectedBusForSeats.bus_type)
      const updatedSeats = generatedSeats.map(seat => ({
        ...seat,
        status: seatsData.reserved_seat_numbers.includes(seat.id) ? 'occupied' : 'available'
      }))
      setSelectedBusSeats(updatedSeats)

    } catch (error) {
      alert(error instanceof Error ? error.message : '직권 예약에 실패했습니다.')
    }
  }

  return (
    <DashboardLayout
      userRole="admin"
      title="관리자 대시보드"
      subtitle="버스 운행과 예약을 관리하세요"
    >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="text-lg font-medium text-gray-500 dark:text-gray-400">총 사용자</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.total_users}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="text-lg font-medium text-gray-500 dark:text-gray-400">운영 버스</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.total_buses}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="text-lg font-medium text-gray-500 dark:text-gray-400">운영 노선</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.total_routes}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="text-lg font-medium text-gray-500 dark:text-gray-400">오늘 예약</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {stats.today_reservations}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  배차 관리
                </h3>
                <div className="flex items-center space-x-4">
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
                  <button
                    onClick={() => setShowNewScheduleForm(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    새 배차 추가
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  예약 날짜:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedBusForSeats?.id === schedule.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => {
                      setSelectedBusForSeats(schedule)
                      setSelectedSeatIds([]) // 버스 변경시 선택 초기화
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{schedule.bus_number}</h4>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            {schedule.bus_type === '28-seat' ? '28인승' : '45인승'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{schedule.route}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">출발: {schedule.departure_time}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">기사: {schedule.driver_name}</p>
                        <div className="mt-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                            {schedule.reserved_seats}/{schedule.total_seats} 예약 ({schedule.occupancy_rate}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSchedule(schedule.id)
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {selectedBusForSeats ? (
              <>
                <BusSeatLayout
                  seats={selectedBusSeats}
                  busType={selectedBusForSeats.bus_type}
                  onSeatSelect={handleSeatSelect}
                  isDriver={false}
                  isAdmin={true}
                  selectedSeats={selectedSeatIds}
                />
                <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">선택된 버스 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">버스 번호:</span>
                      <span className="text-gray-900 dark:text-gray-100">{selectedBusForSeats.bus_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">버스 타입:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {selectedBusForSeats.bus_type === '28-seat' ? '28인승 (2-1 배치)' : '45인승 (2-2 배치)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">예약률:</span>
                      <span className="text-gray-900 dark:text-gray-100">{selectedBusForSeats.occupancy_rate}%</span>
                    </div>
                    {selectedSeatIds.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">선택한 좌석:</span>
                        <div className="mt-1">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {selectedSeatIds.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedSeatIds.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={handleCancelSelectedReservations}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        선택 좌석 예약 취소 ({selectedSeatIds.length}개)
                      </button>
                      <button
                        onClick={handleDirectReservation}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        직권 예매 ({selectedSeatIds.length}개)
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="text-gray-400 text-4xl mb-3">🚌</div>
                <p className="text-gray-500 dark:text-gray-400">배차를 선택하면 좌석 배치도가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                탑승률 현황
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      버스 번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      노선
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      예약/총 좌석
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      탑승률
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {schedule.bus_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {schedule.route}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {schedule.reserved_seats} / {schedule.total_seats}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${schedule.occupancy_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {schedule.occupancy_rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 날짜별 예약 내역 섹션 */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                {selectedDate} 예약 내역
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                총 {stats.today_reservations}개 예약
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      버스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      좌석
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      예약자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      예약 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        선택한 날짜에 운행하는 버스가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((schedule) => {
                      // 각 버스별로 예약 내역이 있다면 표시 (실제로는 API에서 예약 데이터를 가져와야 함)
                      return (
                        <tr key={`empty-${schedule.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {schedule.bus_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {schedule.reserved_seats > 0 ? `${schedule.reserved_seats}개 좌석 예약됨` : '예약 없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              schedule.reserved_seats > 0
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}>
                              {schedule.reserved_seats > 0 ? '운행 예정' : '예약 대기'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            출발: {schedule.departure_time}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {schedules.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    💡 팁: 버스를 선택하면 상세한 좌석별 예약 현황을 확인할 수 있습니다.
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    평균 탑승률: {Math.round(schedules.reduce((acc, s) => acc + s.occupancy_rate, 0) / schedules.length)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* 새 배차 추가 모달 */}
      {showNewScheduleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">새 배차 추가</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">버스 번호</label>
                <input
                  type="text"
                  required
                  value={newSchedule.bus_number}
                  onChange={(e) => setNewSchedule({...newSchedule, bus_number: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">버스 타입</label>
                <select
                  value={newSchedule.bus_type}
                  onChange={(e) => setNewSchedule({...newSchedule, bus_type: e.target.value as BusType})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="28-seat">28인승 (2-1 배치)</option>
                  <option value="45-seat">45인승 (2-2 배치)</option>
                </select>

                {/* 버스 타입 미리보기 */}
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">좌석 배치 미리보기:</p>
                  <div className="scale-75 origin-top-left">
                    <BusSeatLayout
                      seats={generateBusSeats(newSchedule.bus_type)}
                      busType={newSchedule.bus_type}
                      isDriver={true}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">노선</label>
                <input
                  type="text"
                  required
                  value={newSchedule.route}
                  onChange={(e) => setNewSchedule({...newSchedule, route: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">목적지</label>
                <input
                  type="text"
                  required
                  value={newSchedule.destination}
                  onChange={(e) => setNewSchedule({...newSchedule, destination: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">출발 날짜</label>
                  <input
                    type="date"
                    required
                    value={newSchedule.departure_date}
                    onChange={(e) => setNewSchedule({...newSchedule, departure_date: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">출발 시간</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.departure_time}
                    onChange={(e) => setNewSchedule({...newSchedule, departure_time: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">기사 이름</label>
                <input
                  type="text"
                  required
                  value={newSchedule.driver_name}
                  onChange={(e) => setNewSchedule({...newSchedule, driver_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewScheduleForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 직권 예매 모달 */}
      {showDirectReservationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">직권 예매</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  예매 대상 사용자 선택
                </label>
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const userId = parseInt(e.target.value)
                    const user = users.find(u => u.id === userId)
                    setSelectedUser(user || null)
                  }}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">사용자를 선택하세요</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.username}) - {user.phone || user.email || '연락처 없음'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">예매 정보</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>버스: {selectedBusForSeats?.bus_number}</div>
                  <div>날짜: {selectedDate}</div>
                  <div>선택 좌석: {selectedSeatIds.join(', ')}</div>
                  <div>좌석 수: {selectedSeatIds.length}개</div>
                </div>
              </div>

              {selectedUser && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">선택된 사용자</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div>이름: {selectedUser.full_name}</div>
                    <div>아이디: {selectedUser.username}</div>
                    <div>연락처: {selectedUser.phone || selectedUser.email || '등록된 연락처 없음'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowDirectReservationModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDirectReservation}
                disabled={!selectedUser}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
              >
                예매 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}