# 🚌 커뮤니티 버스 예약 시스템

커뮤니티 내 통근 버스를 효율적으로 예약하고 관리할 수 있는 웹 애플리케이션입니다.

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with dark mode support
- **State Management**: React Context API (AuthContext)
- **HTTP Client**: Fetch API with custom wrapper
- **Authentication**: JWT with localStorage + cookie storage

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.12
- **ORM**: SQLAlchemy 2.x
- **Database**: SQLite (개발용)
- **Authentication**: JWT with Bearer tokens
- **API Documentation**: Swagger UI + ReDoc
- **Validation**: Pydantic v2

### Development Tools
- **Package Manager**: npm (Frontend), pip (Backend)
- **Code Quality**: TypeScript strict mode
- **Hot Reload**: Next.js dev server + uvicorn reload

## ✨ 주요 기능

### 👤 일반 사용자
- 목적지별 버스 조회 및 검색
- 실시간 좌석 선택 및 예약
- 예약 내역 관리 및 취소

### ⚙️ 관리자 기능
- **대시보드**: 실시간 통계 및 탑승률 현황
- **버스 관리**: 버스 등록, 수정, 삭제 (28인승/45인승 지원)
- **노선 관리**: 노선 추가, 수정, 삭제 (출발지-도착지 관리)
- **예약 관리**: 전체 예약 조회, 직권 예약/취소
- **사용자 관리**: 전체 사용자 목록 및 권한 관리
- **실시간 좌석 배치도**: 버스별 좌석 현황 시각화

### 🚛 기사님 기능
- **대시보드**: 배정된 버스 운행 현황
- **탑승객 관리**: 당일 예약자 목록 및 승객 정보
- **좌석 배치도**: 28인승/45인승 좌석별 예약 현황
- **실시간 좌석 현황**: 예약/취소/빈자리 실시간 확인

### 🔐 보안 기능
- JWT 기반 인증 시스템
- 역할별 접근 권한 제어
- Next.js Middleware를 통한 라우트 보호
- 자동 토큰 만료 및 갱신

## 🚀 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd Gc-KIT-Bus
```

### 2. 백엔드 설정
```bash
cd backend

# Python 가상환경 생성 (Python 3.12 권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install fastapi uvicorn sqlalchemy pydantic python-jose bcrypt python-multipart

# 데모 데이터 초기화 (선택사항)
python init_demo_data.py

# 백엔드 서버 실행 (개발모드)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# 또는
python main.py
```

백엔드 서버가 http://localhost:8000 에서 실행됩니다.
- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. 프론트엔드 설정
```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 http://localhost:3000 에서 실행됩니다.

## 🔑 데모 계정

시스템 테스트를 위한 데모 계정 정보입니다:

- **관리자**: admin / admin123
- **기사님**: driver1 / driver123
- **사용자**: user1 / user123

## 📚 API 문서

백엔드 서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📁 프로젝트 구조

```
Gc-KIT-Bus/
├── backend/
│   ├── app/
│   │   ├── api/                    # API 엔드포인트
│   │   │   ├── auth.py            # 인증 (로그인, JWT)
│   │   │   ├── users.py           # 사용자 관리
│   │   │   ├── buses.py           # 버스 & 노선 관리
│   │   │   ├── reservations.py    # 예약 관리
│   │   │   └── admin.py           # 관리자 전용 API
│   │   ├── core/                  # 핵심 설정
│   │   │   ├── config.py          # 환경 설정
│   │   │   ├── database.py        # DB 연결 설정
│   │   │   └── security.py        # JWT, 암호화
│   │   ├── models/                # SQLAlchemy 모델
│   │   │   ├── user.py           # 사용자 모델
│   │   │   ├── bus.py            # 버스, 노선 모델
│   │   │   └── reservation.py     # 예약 모델
│   │   └── schemas/               # Pydantic 스키마
│   │       ├── user.py           # 사용자 스키마
│   │       ├── bus.py            # 버스 스키마
│   │       └── reservation.py     # 예약 스키마
│   ├── main.py                    # FastAPI 애플리케이션
│   ├── init_demo_data.py          # 데모 데이터 초기화
│   └── bus_reservation.db         # SQLite 데이터베이스
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── admin/            # 관리자 페이지
│   │   │   │   ├── page.tsx      # 대시보드
│   │   │   │   ├── buses/        # 버스 관리
│   │   │   │   ├── routes/       # 노선 관리
│   │   │   │   ├── reservations/ # 예약 관리
│   │   │   │   └── users/        # 사용자 관리
│   │   │   ├── driver/           # 기사님 페이지
│   │   │   ├── user/             # 사용자 페이지
│   │   │   └── login/            # 로그인 페이지
│   │   ├── components/           # React 컴포넌트
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BusSeatLayout.tsx  # 좌석 배치도
│   │   │   └── ThemeToggle.tsx
│   │   ├── contexts/             # React Context
│   │   │   ├── AuthContext.tsx   # 인증 상태
│   │   │   └── ThemeContext.tsx  # 다크모드
│   │   ├── lib/
│   │   │   └── api.ts            # API 클라이언트
│   │   └── utils/
│   │       └── busSeats.ts       # 좌석 생성 로직
│   ├── middleware.ts             # 인증 미들웨어
│   ├── tailwind.config.js        # Tailwind 설정
│   └── package.json              # 프론트엔드 의존성
├── CLAUDE.md                     # 프로젝트 명세서
└── README.md                     # 이 문서
```

## 🔒 보안 구현

### 인증 플로우
1. 사용자 로그인 → JWT 토큰 발급
2. 토큰을 쿠키 및 localStorage에 저장
3. Next.js Middleware에서 라우트 접근 시 토큰 검증
4. 역할별 페이지 접근 권한 확인

### 권한 제어
- **관리자**: `/admin/*` 경로만 접근 가능
- **기사님**: `/driver/*` 경로만 접근 가능
- **일반사용자**: `/user/*` 경로만 접근 가능

## 🐳 Docker 실행 (선택사항)

Docker를 사용하여 서비스를 실행할 수 있습니다:

```bash
# 백엔드 Docker 실행
cd backend
docker build -t bus-reservation-backend .
docker run -p 8000:8000 bus-reservation-backend

# 프론트엔드 Docker 실행
cd frontend
docker build -t bus-reservation-frontend .
docker run -p 3000:3000 bus-reservation-frontend
```

## 🔧 개발 가이드

### 새로운 API 엔드포인트 추가
1. `backend/app/models/`에 모델 정의
2. `backend/app/schemas/`에 Pydantic 스키마 생성
3. `backend/app/api/`에 API 라우터 구현
4. `backend/main.py`에 라우터 등록

### 새로운 프론트엔드 페이지 추가
1. `frontend/src/app/`에 새 디렉터리 생성
2. `page.tsx` 파일로 페이지 컴포넌트 구현
3. 필요시 `components/`에 재사용 가능한 컴포넌트 생성
4. `lib/api.ts`에 API 호출 함수 추가

## 🎯 주요 특징

### 🎨 UI/UX
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **다크 모드**: 시스템 설정 연동 + 수동 토글
- **직관적 네비게이션**: 역할별 맞춤 사이드바 메뉴
- **실시간 좌석 배치도**: 28인승/45인승 버스 시각화

### 🚌 버스 좌석 시스템
- **28인승 버스**: 2-1 배치 (총 14열)
- **45인승 버스**: 2-2 배치 (10열) + 5연석 (11열)
- **실시간 좌석 상태**: 예약가능/예약됨/선택됨
- **좌석 선택**: 드래그/클릭으로 다중 선택 지원

### 🔐 보안 & 인증
- **JWT 토큰**: Bearer 인증 방식
- **역할 기반 접근 제어**: admin/driver/user
- **자동 로그아웃**: 토큰 만료 시
- **라우트 보호**: Next.js Middleware 활용

### 📊 실시간 데이터
- **예약 현황**: 실시간 좌석 점유율
- **통계 대시보드**: 사용자/버스/노선/예약 수 집계
- **필터링**: 날짜/버스/상태별 조회

## 🔧 개발 환경 설정

### 환경 변수 (.env)
```bash
# Backend
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 추천 개발 도구
- **VS Code Extensions**:
  - TypeScript
  - Tailwind CSS IntelliSense
  - Python
  - SQLite Viewer
- **API 테스트**: Swagger UI (http://localhost:8000/docs)
- **데이터베이스**: SQLite Browser

## 🚨 현재 구현 상태

✅ **완료된 기능:**
- JWT 기반 인증 시스템
- 역할별 페이지 접근 제어 (admin/driver/user)
- 버스 관리 (CRUD)
- 노선 관리 (CRUD)
- 예약 시스템 (생성/조회/취소)
- 실시간 좌석 배치도
- 관리자 대시보드 (통계)
- 반응형 UI + 다크모드
- 실시간 데이터 동기화

🔧 **개발 중인 기능:**
- 사용자 관리 페이지
- 통계 상세 페이지
- 알림 시스템

💡 **향후 개선 계획:**
- HTTPS 환경 구성
- Redis 캐싱
- WebSocket 실시간 알림
- 이메일 알림
- 모바일 앱 (React Native)

## 📄 라이선스

MIT License