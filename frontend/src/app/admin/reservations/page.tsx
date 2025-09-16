'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { reservationAPI, busAPI, adminAPI, Reservation, Bus } from '@/lib/api'

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterBus, setFilterBus] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDirectBookingForm, setShowDirectBookingForm] = useState(false)
  const router = useRouter()

  const [directBookingForm, setDirectBookingForm] = useState({
    user_id: '',
    bus_id: '',
    seat_numbers: '',
    reservation_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [reservationsData, busesData] = await Promise.all([
        reservationAPI.getAll(),
        busAPI.getAll()
      ])

      setReservations(reservationsData)
      setBuses(busesData)
    } catch (error) {
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) {
      return
    }

    try {
      await reservationAPI.cancel(reservationId)
      alert('예약이 취소되었습니다.')
      loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : '예약 취소에 실패했습니다.')
    }
  }

  const handleDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!directBookingForm.user_id || !directBookingForm.bus_id || !directBookingForm.seat_numbers) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    try {
      const seatNumbers = directBookingForm.seat_numbers.split(',').map(s => s.trim())

      await adminAPI.createDirectReservation({
        user_id: parseInt(directBookingForm.user_id),
        bus_id: parseInt(directBookingForm.bus_id),
        seat_numbers: seatNumbers
      })

      alert('직권 예약이 완료되었습니다.')
      setShowDirectBookingForm(false)
      setDirectBookingForm({
        user_id: '',
        bus_id: '',
        seat_numbers: '',
        reservation_date: new Date().toISOString().split('T')[0]
      })
      loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : '직권 예약에 실패했습니다.')
    }
  }

  // 필터링된 예약 목록
  const filteredReservations = reservations.filter(reservation => {
    let matches = true

    if (filterDate) {
      matches = matches && reservation.reservation_date === filterDate
    }

    if (filterBus !== 'all') {
      matches = matches && reservation.bus_id === parseInt(filterBus)
    }

    if (filterStatus !== 'all') {
      matches = matches && reservation.status === filterStatus
    }

    return matches
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">확정</span>
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">취소됨</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">{status}</span>
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        userRole="admin"
        title="예약 관리"
        subtitle="모든 예약을 확인하고 관리할 수 있습니다"
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole="admin"
      title="예약 관리"
      subtitle="모든 예약을 확인하고 관리할 수 있습니다"
    >
      <div className="space-y-6">
        {/* 직권 예약 폼 */}
        {showDirectBookingForm && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              직권 예약
            </h3>

            <form onSubmit={handleDirectBooking} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  사용자 ID
                </label>
                <input
                  type="number"
                  required
                  value={directBookingForm.user_id}
                  onChange={(e) => setDirectBookingForm({...directBookingForm, user_id: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  버스 선택
                </label>
                <select
                  required
                  value={directBookingForm.bus_id}
                  onChange={(e) => setDirectBookingForm({...directBookingForm, bus_id: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">버스를 선택하세요</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.bus_number} - {bus.route}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  좌석 번호 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  required
                  value={directBookingForm.seat_numbers}
                  onChange={(e) => setDirectBookingForm({...directBookingForm, seat_numbers: e.target.value})}
                  placeholder="1A, 2B, 3C"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  예약 날짜
                </label>
                <input
                  type="date"
                  required
                  value={directBookingForm.reservation_date}
                  onChange={(e) => setDirectBookingForm({...directBookingForm, reservation_date: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2 flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  직권 예약
                </button>
                <button
                  type="button"
                  onClick={() => setShowDirectBookingForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 필터 및 액션 바 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                날짜 필터
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                버스 필터
              </label>
              <select
                value={filterBus}
                onChange={(e) => setFilterBus(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">모든 버스</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.bus_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상태 필터
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">모든 상태</option>
                <option value="confirmed">확정</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            <div>
              {!showDirectBookingForm && (
                <button
                  onClick={() => setShowDirectBookingForm(true)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  직권 예약
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              예약 목록 ({filteredReservations.length}건)
            </h3>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    예약 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    승객 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    버스 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    날짜/좌석
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        예약 #{reservation.id}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {reservation.departure_time} 출발
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {reservation.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {reservation.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {reservation.bus_number}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {reservation.route}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {reservation.reservation_date}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        좌석: {reservation.seat_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(reservation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          직권 취소
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredReservations.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                조건에 맞는 예약이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}