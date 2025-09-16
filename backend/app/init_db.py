from sqlalchemy.orm import Session
from app.core.database import engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.bus import Bus, BusRoute
from datetime import time

def create_tables():
    Base.metadata.create_all(bind=engine)

def init_sample_data():
    from app.core.database import SessionLocal
    db = SessionLocal()
    
    try:
        # 기본 관리자 계정 생성
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="시스템 관리자",
                role=UserRole.ADMIN
            )
            db.add(admin_user)
        
        # 기본 기사 계정 생성
        driver_user = db.query(User).filter(User.username == "driver1").first()
        if not driver_user:
            driver_user = User(
                username="driver1",
                email="driver1@example.com",
                hashed_password=get_password_hash("driver123"),
                full_name="김기사",
                role=UserRole.DRIVER
            )
            db.add(driver_user)
        
        # 기본 사용자 계정 생성
        test_user = db.query(User).filter(User.username == "user1").first()
        if not test_user:
            test_user = User(
                username="user1",
                email="user1@example.com",
                hashed_password=get_password_hash("user123"),
                full_name="김사용자"
            )
            db.add(test_user)
        
        db.commit()
        
        # 노선 생성
        route1 = db.query(BusRoute).filter(BusRoute.name == "강남역-분당").first()
        if not route1:
            route1 = BusRoute(
                name="강남역-분당",
                departure_location="강남역",
                destination="분당"
            )
            db.add(route1)
        
        route2 = db.query(BusRoute).filter(BusRoute.name == "분당-강남역").first()
        if not route2:
            route2 = BusRoute(
                name="분당-강남역",
                departure_location="분당",
                destination="강남역"
            )
            db.add(route2)
        
        db.commit()
        
        # 버스 생성
        bus1 = db.query(Bus).filter(Bus.bus_number == "1001").first()
        if not bus1:
            bus1 = Bus(
                bus_number="1001",
                route_id=route1.id,
                driver_id=driver_user.id,
                departure_time=time(7, 30),
                arrival_time=time(8, 30),
                total_seats=45
            )
            db.add(bus1)
        
        bus2 = db.query(Bus).filter(Bus.bus_number == "1002").first()
        if not bus2:
            bus2 = Bus(
                bus_number="1002",
                route_id=route2.id,
                driver_id=driver_user.id,
                departure_time=time(18, 30),
                arrival_time=time(19, 30),
                total_seats=45
            )
            db.add(bus2)
        
        db.commit()
        
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating database tables...")
    create_tables()
    print("Initializing sample data...")
    init_sample_data()
    print("Database initialization complete!")