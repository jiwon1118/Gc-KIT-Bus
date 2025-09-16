'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  userRole: UserRole
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function Sidebar({ userRole, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { name: '대시보드', path: '/admin', icon: '📊' },
          { name: '버스 관리', path: '/admin/buses', icon: '🚌' },
          { name: '노선 관리', path: '/admin/routes', icon: '🛣️' },
          { name: '예약 관리', path: '/admin/reservations', icon: '📋' },
          { name: '사용자 관리', path: '/admin/users', icon: '👥' },
          { name: '통계', path: '/admin/stats', icon: '📈' },
        ]
      case 'driver':
        return [
          { name: '대시보드', path: '/driver', icon: '🚌' },
          { name: '승객 목록', path: '/driver/passengers', icon: '👥' },
          { name: '운행 기록', path: '/driver/routes', icon: '📍' },
        ]
      case 'user':
        return [
          { name: '버스 예약', path: '/user', icon: '🎫' },
          { name: '예약 내역', path: '/user/reservations', icon: '📋' },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout()
    }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40 ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:block`}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-white">커뮤니티 버스</h1>
            <p className="text-sm text-gray-300">{user?.full_name || userRole}</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => {
                  router.push(item.path)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && <span className="text-sm text-gray-300">테마</span>}
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          title={isCollapsed ? '로그아웃' : ''}
        >
          <span className="text-xl mr-3">🚪</span>
          {!isCollapsed && <span className="font-medium">로그아웃</span>}
        </button>
      </div>
    </div>
    </>
  )
}