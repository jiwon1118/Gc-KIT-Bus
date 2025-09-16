'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export type UserRole = 'admin' | 'driver' | 'user'

export interface User {
  id: number
  username: string
  role: UserRole
  full_name: string
  email?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 데모 계정 정보
  const demoAccounts = {
    admin: { username: 'admin', password: 'admin123' },
    driver: { username: 'driver1', password: 'driver123' },
    user: { username: 'user1', password: 'user123' }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        // JWT 토큰 검증 (간단한 형태)
        try {
          const payload = JSON.parse(atob(token.split('.')[1] || '{}'))
          const now = Date.now() / 1000

          // 토큰 만료 확인
          if (payload.exp && payload.exp < now) {
            throw new Error('Token expired')
          }

          setUser(JSON.parse(userData))
        } catch {
          // 토큰이 유효하지 않으면 로그아웃
          logout()
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const createToken = (user: User): string => {
    // 간단한 JWT 토큰 생성 (실제 프로덕션에서는 서버에서 생성해야 함)
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24시간 후 만료
    }

    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = btoa(`signature_for_${user.username}`) // 실제로는 암호화된 서명

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  const login = async (username: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      setLoading(true)

      // 실제 백엔드 API 사용
      const isDemoMode = false // 백엔드 준비 완료

      if (isDemoMode) {
        // 데모 계정 검증
        const demoAccount = demoAccounts[role]
        if (username !== demoAccount.username || password !== demoAccount.password) {
          return false
        }

        const userData: User = {
          id: 1,
          username,
          role,
          full_name: role === 'admin' ? '관리자' :
                    role === 'driver' ? '김기사' : '홍길동',
          email: `${username}@company.com`,
          phone: role === 'admin' ? '02-1234-5678' : '010-1234-5678'
        }

        const token = createToken(userData)

        // 로컬 스토리지에 저장
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))

        // 쿠키에도 토큰 저장 (미들웨어에서 사용)
        document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; samesite=strict`

        setUser(userData)

        // 역할에 따른 페이지로 리디렉션
        const redirectPath = role === 'admin' ? '/admin' :
                            role === 'driver' ? '/driver' : '/user'
        router.push(redirectPath)

        return true
      } else {
        // 실제 API 호출 (백엔드 준비 시 사용)
        const { authAPI } = await import('@/lib/api')

        const response = await authAPI.login({
          username,
          password
        })

        // 토큰과 사용자 정보 저장
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.user))

        // 쿠키에도 토큰 저장
        document.cookie = `token=${response.access_token}; path=/; max-age=${24 * 60 * 60}; samesite=strict`

        setUser(response.user as User)

        // 역할에 따른 페이지로 리디렉션
        const redirectPath = response.user.role === 'admin' ? '/admin' :
                            response.user.role === 'driver' ? '/driver' : '/user'
        router.push(redirectPath)

        return true
      }
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    setUser(null)
    router.push('/login')
  }

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}