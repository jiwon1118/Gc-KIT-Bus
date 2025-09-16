from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ReservationStatus(enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)
    seat_number = Column(String(10), nullable=False)  # 좌석 번호
    reservation_date = Column(Date, nullable=False)  # 예약 날짜
    status = Column(Enum(ReservationStatus), default=ReservationStatus.CONFIRMED, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # 취소한 사용자 (관리자의 경우)

    # Relationships
    user = relationship("User", back_populates="reservations", foreign_keys=[user_id])
    bus = relationship("Bus", back_populates="reservations")
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])