'use client'

import { ReactNode, useState } from 'react'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  userRole: UserRole
  title?: string
  subtitle?: string
}

export default function DashboardLayout({
  children,
  userRole,
  title,
  subtitle
}: DashboardLayoutProps) {
  const { user, loading, hasRole } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 임시로 인증 체크 비활성화 (데모용)
  const skipAuth = false

  if (!skipAuth) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              인증이 필요합니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              로그인 후 이용해 주세요.
            </p>
          </div>
        </div>
      )
    }

    if (!hasRole(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              접근 권한이 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              이 페이지에 접근할 권한이 없습니다.
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        userRole={userRole}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="min-h-full">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                커뮤니티 버스
              </h1>
              <div className="w-10" /> {/* Spacer */}
            </div>
          </header>

          {/* Page Header */}
          {(title || subtitle) && (
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 sm:px-6 py-4">
                {title && (
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </header>
          )}

          {/* Page Content */}
          <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}