'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { routeAPI, Route } from '@/lib/api'

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    departure_location: '',
    destination: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    loadRoutes()
  }, [router])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      const data = await routeAPI.getAll()
      setRoutes(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : '노선 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRoute) {
        await routeAPI.update(editingRoute.id, formData)
        alert('노선이 수정되었습니다.')
      } else {
        await routeAPI.create(formData)
        alert('노선이 추가되었습니다.')
      }

      setShowAddForm(false)
      setEditingRoute(null)
      resetForm()
      loadRoutes()
    } catch (error) {
      alert(error instanceof Error ? error.message : '노선 저장에 실패했습니다.')
    }
  }

  const handleEdit = (route: Route) => {
    setEditingRoute(route)
    setFormData({
      name: route.name,
      departure_location: route.departure_location,
      destination: route.destination
    })
    setShowAddForm(true)
  }

  const handleDelete = async (routeId: number) => {
    if (!confirm('정말로 이 노선을 삭제하시겠습니까? 이 노선을 사용하는 버스가 있으면 삭제할 수 없습니다.')) {
      return
    }

    try {
      await routeAPI.delete(routeId)
      alert('노선이 삭제되었습니다.')
      loadRoutes()
    } catch (error) {
      alert(error instanceof Error ? error.message : '노선 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      departure_location: '',
      destination: ''
    })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingRoute(null)
    resetForm()
  }

  if (loading) {
    return (
      <DashboardLayout
        userRole="admin"
        title="노선 관리"
        subtitle="버스 노선을 추가, 수정, 삭제할 수 있습니다"
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
      title="노선 관리"
      subtitle="버스 노선을 추가, 수정, 삭제할 수 있습니다"
    >
      <div className="space-y-6">
        {/* 노선 추가/수정 폼 */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {editingRoute ? '노선 수정' : '새 노선 추가'}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  노선명
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="강남-판교선"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  출발지
                </label>
                <input
                  type="text"
                  required
                  value={formData.departure_location}
                  onChange={(e) => setFormData({...formData, departure_location: e.target.value})}
                  placeholder="강남"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  도착지
                </label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  placeholder="판교 테크노밸리"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2 flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingRoute ? '수정' : '추가'}
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

        {/* 노선 목록 */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              노선 목록 ({routes.length}개)
            </h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + 노선 추가
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
                    노선명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    경로
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    생성일
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
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {route.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {route.departure_location} → {route.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(route.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        route.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {route.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(route)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {routes.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                등록된 노선이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}