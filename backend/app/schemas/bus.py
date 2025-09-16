from pydantic import BaseModel
from typing import Optional, List
from datetime import time, datetime
from app.models.bus import BusType

class BusRouteBase(BaseModel):
    name: str
    departure_location: str
    destination: str

class BusRouteCreate(BusRouteBase):
    pass

class BusRouteUpdate(BaseModel):
    name: Optional[str] = None
    departure_location: Optional[str] = None
    destination: Optional[str] = None

class BusRoute(BusRouteBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class BusBase(BaseModel):
    bus_number: str
    route_id: int
    driver_id: Optional[int] = None
    bus_type: BusType = BusType.SEAT_28
    total_seats: int = 28
    departure_time: time
    arrival_time: time

class BusCreate(BusBase):
    pass

class BusUpdate(BaseModel):
    bus_number: Optional[str] = None
    route_id: Optional[int] = None
    driver_id: Optional[int] = None
    bus_type: Optional[BusType] = None
    total_seats: Optional[int] = None
    departure_time: Optional[time] = None
    arrival_time: Optional[time] = None

class Bus(BusBase):
    id: int
    is_active: bool
    created_at: datetime
    route: Optional[BusRoute] = None

    # 프론트엔드 호환성을 위한 추가 필드들
    destination: Optional[str] = None
    available_seats: Optional[int] = None
    occupancy_rate: Optional[float] = None

    class Config:
        from_attributes = True