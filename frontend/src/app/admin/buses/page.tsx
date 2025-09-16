'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { busAPI, routeAPI, userAPI, Bus, Route } from '@/lib/api'

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    bus_number: '',
    route_id: '',
    driver_id: '',
    departure_time: '',
    arrival_time: '',
    bus_type: '28-seat' as '28-seat' | '45-seat',
    total_seats: 28
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
      const [busesData, routesData, driversData] = await Promise.all([
        busAPI.getAll(),
        routeAPI.getAll(),
        userAPI.getDrivers()
      ])
      setBuses(busesData)
      setRoutes(routesData)
      setDrivers(driversData)
    } catch (error) {
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const selectedRoute = routes.find(r => r.id === parseInt(formData.route_id))
      const submitData = {
        bus_number: formData.bus_number,
        route_id: parseInt(formData.route_id),
        driver_id: parseInt(formData.driver_id),
        bus_type: formData.bus_type,
        total_seats: formData.total_seats,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        route: selectedRoute?.name || '',
        destination: selectedRoute?.destination || ''
      }

      if (editingBus) {
        await busAPI.update(editingBus.id, submitData)
        alert('버스가 수정되었습니다.')
      } else {
        await busAPI.create(submitData)
        alert('버스가 추가되었습니다.')
      }

      setShowAddForm(false)
      setEditingBus(null)
      resetForm()
      loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : '버스 저장에 실패했습니다.')
    }
  }

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus)
    // Find the route_id from the route string
    const matchingRoute = routes.find(r => bus.route === `${r.departure_location} → ${r.destination}`)
    setFormData({
      bus_number: bus.bus_number,
      route_id: matchingRoute?.id.toString() || '',
      driver_id: '', // 일단 빈값으로 두고 사용자가 다시 선택하도록
      departure_time: bus.departure_time,
      arrival_time: bus.arrival_time,
      bus_type: bus.bus_type,
      total_seats: bus.total_seats
    })
    setShowAddForm(true)
  }

  const handleDelete = async (busId: number) => {
    if (!confirm('정말로 이 버스를 삭제하시겠습니까?')) {
      return
    }

    try {
      await busAPI.delete(busId)
      alert('버스가 삭제되었습니다.')
      loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : '버스 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({
      bus_number: '',
      route_id: '',
      driver_id: '',
      departure_time: '',
      arrival_time: '',
      bus_type: '28-seat',
      total_seats: 28
    })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingBus(null)
    resetForm()
  }

  if (loading) {
    return (
      <DashboardLayout
        userRole="admin"
        title="버스 관리"
        subtitle="버스를 추가, 수정, 삭제할 수 있습니다"
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
      title="버스 관리"
      subtitle="버스를 추가, 수정, 삭제할 수 있습니다"
    >
      <div className="space-y-6">
        {/* 버스 추가/수정 폼 */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {editingBus ? '버스 수정' : '새 버스 추가'}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  버스 번호
                </label>
                <input
                  type="text"
                  required
                  value={formData.bus_number}
                  onChange={(e) => setFormData({...formData, bus_number: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  노선
                </label>
                <select
                  required
                  value={formData.route_id}
                  onChange={(e) => setFormData({...formData, route_id: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">노선을 선택하세요</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.departure_location} → {route.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  기사 배정
                </label>
                <select
                  required
                  value={formData.driver_id}
                  onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">기사를 선택하세요</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  출발 시간
                </label>
                <input
                  type="time"
                  required
                  value={formData.departure_time}
                  onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  도착 시간
                </label>
                <input
                  type="time"
                  required
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({...formData, arrival_time: e.target.value})}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  버스 타입
                </label>
                <select
                  value={formData.bus_type}
                  onChange={(e) => {
                    const busType = e.target.value as '28-seat' | '45-seat'
                    setFormData({
                      ...formData,
                      bus_type: busType,
                      total_seats: busType === '28-seat' ? 28 : 45
                    })
                  }}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="28-seat">28인승</option>
                  <option value="45-seat">45인승</option>
                </select>
              </div>

              <div className="md:col-span-2 flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingBus ? '수정' : '추가'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 버스 목록 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              버스 목록 ({buses.length}대)
            </h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + 버스 추가
              </button>
            )}
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
                    버스 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    노선
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    운행 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    좌석 현황
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {buses.map((bus) => (
                  <tr key={bus.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {bus.bus_number}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {bus.bus_type === '28-seat' ? '28인승' : '45인승'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {bus.route}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        → {bus.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {bus.departure_time} - {bus.arrival_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {bus.available_seats}/{bus.total_seats}석
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        점유율: {bus.occupancy_rate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(bus)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(bus.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {buses.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                등록된 버스가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}