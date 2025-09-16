from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from app.models.reservation import ReservationStatus
from .user import User
from .bus import Bus

class ReservationBase(BaseModel):
    bus_id: int
    seat_number: str
    reservation_date: date

class ReservationCreate(ReservationBase):
    pass

class ReservationUpdate(BaseModel):
    status: Optional[ReservationStatus] = None

class Reservation(ReservationBase):
    id: int
    user_id: int
    status: ReservationStatus
    created_at: datetime
    updated_at: datetime
    user: Optional[User] = None
    bus: Optional[Bus] = None

    class Config:
        from_attributes = True