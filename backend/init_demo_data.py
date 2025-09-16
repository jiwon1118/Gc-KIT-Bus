"""
데모 데이터 초기화 스크립트
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.bus import Bus, BusRoute
from app.models.reservation import Reservation, ReservationStatus
from app.core.security import get_password_hash
from datetime import datetime, time
import app.models.user
import app.models.bus
import app.models.reservation

# 모든 테이블 생성
def create_tables():
    import app.models.user
    import app.models.bus
    import app.models.reservation
    User.metadata.create_all(bind=engine)

def init_demo_users(db: Session):
    """데모 사용자 생성"""
    demo_users = [
        {
            "username": "admin",
            "email": "admin@company.com",
            "hashed_password": get_password_hash("admin123"),
            "full_name": "관리자",
            "phone": "02-1234-5678",
            "role": UserRole.ADMIN
        },
        {
            "username": "driver1",
            "email": "driver1@company.com",
            "hashed_password": get_password_hash("driver123"),
            "full_name": "김기사",
            "phone": "010-1111-2222",
            "role": UserRole.DRIVER
        },
        {
            "username": "user1",
            "email": "user1@company.com",
            "hashed_password": get_password_hash("user123"),
            "full_name": "홍길동",
            "phone": "010-3333-4444",
            "role": UserRole.USER
        }
    ]

    for user_data in demo_users:
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing_user:
            db_user = User(**user_data)
            db.add(db_user)

    db.commit()
    print("✅ 데모 사용자 생성 완료")

def init_demo_routes(db: Session):
    """데모 노선 데이터 생성"""
    demo_routes = [
        {
            "name": "강남-판교선",
            "departure_location": "강남",
            "destination": "판교 테크노밸리"
        },
        {
            "name": "잠실-강남선",
            "departure_location": "잠실",
            "destination": "강남역"
        },
        {
            "name": "서울역-여의도선",
            "departure_location": "서울역",
            "destination": "여의도 IFC"
        }
    ]

    for route_data in demo_routes:
        existing_route = db.query(BusRoute).filter(BusRoute.name == route_data["name"]).first()
        if not existing_route:
            db_route = BusRoute(**route_data)
            db.add(db_route)

    db.commit()
    print("✅ 데모 노선 데이터 생성 완료")

def init_demo_buses(db: Session):
    """데모 버스 데이터 생성"""
    demo_buses = [
        {
            "bus_number": "BUS-001",
            "route_id": 1,  # 강남-판교선
            "departure_time": time(8, 0),
            "arrival_time": time(8, 45),
            "total_seats": 45,
            "driver_id": 2  # driver1
        },
        {
            "bus_number": "BUS-002",
            "route_id": 2,  # 잠실-강남선
            "departure_time": time(8, 30),
            "arrival_time": time(9, 15),
            "total_seats": 28,
            "driver_id": 2
        },
        {
            "bus_number": "BUS-003",
            "route_id": 3,  # 서울역-여의도선
            "departure_time": time(7, 45),
            "arrival_time": time(8, 20),
            "total_seats": 45,
            "driver_id": 2
        }
    ]

    for bus_data in demo_buses:
        existing_bus = db.query(Bus).filter(Bus.bus_number == bus_data["bus_number"]).first()
        if not existing_bus:
            db_bus = Bus(**bus_data)
            db.add(db_bus)

    db.commit()
    print("✅ 데모 버스 데이터 생성 완료")

def init_demo_reservations(db: Session):
    """데모 예약 데이터 생성"""
    demo_reservations = [
        {
            "user_id": 3,  # user1
            "bus_id": 1,   # BUS-001
            "seat_number": "15",
            "reservation_date": datetime.now().date(),
            "status": ReservationStatus.CONFIRMED
        },
        {
            "user_id": 3,
            "bus_id": 2,   # BUS-002
            "seat_number": "10",
            "reservation_date": datetime.now().date(),
            "status": ReservationStatus.CONFIRMED
        }
    ]

    for reservation_data in demo_reservations:
        existing_reservation = db.query(Reservation).filter(
            Reservation.user_id == reservation_data["user_id"],
            Reservation.bus_id == reservation_data["bus_id"],
            Reservation.seat_number == reservation_data["seat_number"]
        ).first()

        if not existing_reservation:
            db_reservation = Reservation(**reservation_data)
            db.add(db_reservation)

    db.commit()
    print("✅ 데모 예약 데이터 생성 완료")

def main():
    """메인 함수"""
    create_tables()

    db = SessionLocal()
    try:
        print("🚀 데모 데이터 초기화 시작...")
        init_demo_users(db)
        init_demo_routes(db)
        init_demo_buses(db)
        init_demo_reservations(db)
        print("✨ 모든 데모 데이터 초기화 완료!")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()