import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 보호되지 않은 경로들 (임시로 모든 경로 허용)
  const publicPaths = ['/', '/login', '/user', '/admin', '/driver']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // 토큰 확인
  const token = request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')

  // 로그인 페이지에 이미 로그인된 사용자가 접근하는 경우
  if (pathname === '/login' && token) {
    try {
      // 토큰에서 역할 정보 추출 (간단한 디코딩)
      const payload = JSON.parse(atob(token.split('.')[1] || '{}'))
      const role = payload.role || 'user'

      // 역할에 따라 적절한 페이지로 리디렉션
      const dashboardPath = role === 'admin' ? '/admin' :
                           role === 'driver' ? '/driver' : '/user'
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    } catch {
      // 토큰이 유효하지 않으면 로그인 페이지 허용
      return NextResponse.next()
    }
  }

  // 보호된 경로에 토큰 없이 접근하는 경우
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 역할별 접근 권한 확인
  if (token && !isPublicPath) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || '{}'))
      const userRole = payload.role || 'user'

      // 역할별 허용된 경로 확인
      const roleBasedAccess = {
        admin: ['/admin'],
        driver: ['/driver'],
        user: ['/user']
      }

      const allowedPaths = roleBasedAccess[userRole as keyof typeof roleBasedAccess] || []
      const hasAccess = allowedPaths.some(path => pathname.startsWith(path))

      if (!hasAccess) {
        // 권한이 없는 경우 본인의 대시보드로 리디렉션
        const defaultPath = userRole === 'admin' ? '/admin' :
                           userRole === 'driver' ? '/driver' : '/user'
        return NextResponse.redirect(new URL(defaultPath, request.url))
      }
    } catch {
      // 토큰이 유효하지 않으면 로그인 페이지로 리디렉션
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}