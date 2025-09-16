'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { adminAPI, busAPI, reservationAPI, DashboardStats, Bus, Reservation } from '@/lib/api'

export default function AdminStatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [buses, setBuses] = useState<Bus[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const router = useRouter()

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
      const [statsData, busesData, reservationsData] = await Promise.all([
        adminAPI.getStats(),
        busAPI.getAll(),
        reservationAPI.getAll()
      ])

      setStats(statsData)
      setBuses(busesData)
      setReservations(reservationsData)
    } catch (error) {
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 통계 계산 함수들
  const getTotalReservations = () => {
    return reservations.filter(r => r.status === 'confirmed').length
  }

  const getTodayReservations = () => {
    const today = new Date().toISOString().split('T')[0]
    return reservations.filter(r =>
      r.status === 'confirmed' &&
      r.reservation_date === today
    ).length
  }

  const getCancelledReservations = () => {
    return reservations.filter(r => r.status === 'cancelled').length
  }

  const getPopularRoutes = () => {
    const routeCounts: { [key: string]: number } = {}

    reservations
      .filter(r => r.status === 'confirmed')
      .forEach(reservation => {
        if (reservation.route) {
          routeCounts[reservation.route] = (routeCounts[reservation.route] || 0) + 1
        }
      })

    return Object.entries(routeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const getBusUtilization = () => {
    return buses.map(bus => ({
      bus_number: bus.bus_number,
      route: bus.route,
      total_seats: bus.total_seats,
      available_seats: bus.available_seats,
      occupancy_rate: bus.occupancy_rate,
      reserved_today: reservations.filter(r =>
        r.bus_id === bus.id &&
        r.status === 'confirmed' &&
        r.reservation_date === new Date().toISOString().split('T')[0]
      ).length
    }))
  }

  const getReservationTrends = () => {
    const last7Days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const count = reservations.filter(r =>
        r.status === 'confirmed' &&
        r.reservation_date === dateStr
      ).length

      last7Days.push({
        date: dateStr,
        count,
        label: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      })
    }

    return last7Days
  }

  if (loading) {
    return (
      <DashboardLayout
        userRole="admin"
        title="통계"
        subtitle="시스템 전체 통계를 확인할 수 있습니다"
      >
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </DashboardLayout>
    )
  }

  const popularRoutes = getPopularRoutes()
  const busUtilization = getBusUtilization()
  const reservationTrends = getReservationTrends()

  return (
    <DashboardLayout
      userRole="admin"
      title="통계"
      subtitle="시스템 전체 통계를 확인할 수 있습니다"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      총 버스 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {buses.length}대
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
                    <span className="text-white text-sm">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      총 예약 수
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {getTotalReservations()}건
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
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      오늘 예약
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {getTodayReservations()}건
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
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">✕</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      취소된 예약
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {getCancelledReservations()}건
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 예약 트렌드 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            최근 7일 예약 현황
          </h3>
          <div className="flex items-end justify-between space-x-2 h-40">
            {reservationTrends.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-t-lg flex items-end justify-center relative">
                  <div
                    className="bg-blue-500 rounded-t-lg w-full transition-all duration-300 flex items-end justify-center text-white text-xs font-medium"
                    style={{
                      height: `${Math.max((day.count / Math.max(...reservationTrends.map(d => d.count), 1)) * 120, 20)}px`
                    }}
                  >
                    {day.count > 0 && day.count}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {day.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 인기 노선 */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
              인기 노선 TOP 5
            </h3>
            <div className="space-y-3">
              {popularRoutes.length > 0 ? (
                popularRoutes.map(([route, count], index) => (
                  <div key={route} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="ml-3 text-sm text-gray-900 dark:text-gray-100 truncate">
                        {route}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {count}건
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  예약 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 버스별 탑승률 */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
              버스별 탑승률
            </h3>
            <div className="space-y-4">
              {busUtilization.map((bus) => (
                <div key={bus.bus_number} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {bus.bus_number}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bus.route}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {bus.occupancy_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bus.total_seats - bus.available_seats}/{bus.total_seats}석
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        bus.occupancy_rate >= 90
                          ? 'bg-red-500'
                          : bus.occupancy_rate >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${bus.occupancy_rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}