from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Time, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class BusType(enum.Enum):
    SEAT_28 = "28-seat"
    SEAT_45 = "45-seat"

class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # 노선명
    departure_location = Column(String, nullable=False)  # 출발지
    destination = Column(String, nullable=False)  # 목적지
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    buses = relationship("Bus", back_populates="route")

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String, unique=True, nullable=False)  # 버스 번호
    route_id = Column(Integer, ForeignKey("bus_routes.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bus_type = Column(Enum(BusType), default=BusType.SEAT_28, nullable=False)  # 버스 타입
    total_seats = Column(Integer, default=28, nullable=False)  # 총 좌석 수
    departure_time = Column(Time, nullable=False)  # 출발 시간
    arrival_time = Column(Time, nullable=False)  # 도착 시간
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    route = relationship("BusRoute", back_populates="buses")
    driver = relationship("User", back_populates="buses_driven")
    reservations = relationship("Reservation", back_populates="bus")