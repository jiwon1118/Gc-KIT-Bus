from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.bus import Bus, BusRoute
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.bus import Bus as BusSchema, BusCreate, BusUpdate, BusRoute as BusRouteSchema, BusRouteCreate, BusRouteUpdate
from app.api.auth import get_current_user
from datetime import date

router = APIRouter()

@router.get("/routes", response_model=List[BusRouteSchema])
async def get_routes(db: Session = Depends(get_db)):
    routes = db.query(BusRoute).filter(BusRoute.is_active == True).all()
    return routes

@router.post("/routes", response_model=BusRouteSchema)
async def create_route(
    route_data: BusRouteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    route = BusRoute(**route_data.dict())
    db.add(route)
    db.commit()
    db.refresh(route)
    return route

@router.put("/routes/{route_id}", response_model=BusRouteSchema)
async def update_route(
    route_id: int,
    route_update: BusRouteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    # Update only provided fields
    update_data = route_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(route, field, value)

    db.commit()
    db.refresh(route)
    return route

@router.delete("/routes/{route_id}")
async def delete_route(
    route_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    route = db.query(BusRoute).filter(BusRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    # Check if any buses are using this route
    buses_using_route = db.query(Bus).filter(Bus.route_id == route_id, Bus.is_active == True).count()
    if buses_using_route > 0:
        raise HTTPException(status_code=400, detail="Cannot delete route that is in use by active buses")

    # Soft delete by setting is_active to False
    route.is_active = False
    db.commit()

    return {"message": "Route deleted successfully"}

@router.get("/")
async def get_buses(
    destination: str = None,
    reservation_date: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bus).join(BusRoute).filter(Bus.is_active == True)

    if destination:
        query = query.filter(BusRoute.destination == destination)

    buses = query.all()

    # 프론트엔드 호환성을 위해 데이터 형태 변환
    result = []
    for bus in buses:
        # 해당 버스의 예약된 좌석 수 계산
        target_date = date.today()
        if reservation_date:
            try:
                from datetime import datetime
                target_date = datetime.strptime(reservation_date, "%Y-%m-%d").date()
            except ValueError:
                target_date = date.today()

        reserved_count = db.query(Reservation).filter(
            Reservation.bus_id == bus.id,
            Reservation.reservation_date == target_date,
            Reservation.status == ReservationStatus.CONFIRMED
        ).count()

        available_seats = bus.total_seats - reserved_count
        occupancy_rate = (reserved_count / bus.total_seats) * 100 if bus.total_seats > 0 else 0

        bus_data = {
            "id": bus.id,
            "bus_number": bus.bus_number,
            "route": f"{bus.route.departure_location} → {bus.route.destination}" if bus.route else "",
            "departure_time": bus.departure_time.strftime("%H:%M"),
            "arrival_time": bus.arrival_time.strftime("%H:%M"),
            "destination": bus.route.destination if bus.route else "",
            "bus_type": f"{bus.total_seats}-seat",
            "total_seats": bus.total_seats,
            "available_seats": available_seats,
            "occupancy_rate": round(occupancy_rate, 1)
        }
        result.append(bus_data)

    return result

@router.get("/{bus_id}", response_model=BusSchema)
async def get_bus(bus_id: int, db: Session = Depends(get_db)):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return bus

@router.post("/", response_model=BusSchema)
async def create_bus(
    bus_data: BusCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    bus = Bus(**bus_data.dict())
    db.add(bus)
    db.commit()
    db.refresh(bus)
    return bus

@router.get("/{bus_id}/seats")
async def get_bus_seats(
    bus_id: int,
    reservation_date: date,
    db: Session = Depends(get_db)
):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    # Get reserved seats for the date
    reserved_seats = db.query(Reservation.seat_number).filter(
        Reservation.bus_id == bus_id,
        Reservation.reservation_date == reservation_date,
        Reservation.status == ReservationStatus.CONFIRMED
    ).all()

    reserved_seat_numbers = [seat[0] for seat in reserved_seats]

    return {
        "bus_id": bus_id,
        "bus_type": f"{bus.total_seats}-seat",
        "total_seats": bus.total_seats,
        "reserved_seats": len(reserved_seat_numbers),
        "available_seats": bus.total_seats - len(reserved_seat_numbers),
        "reserved_seat_numbers": reserved_seat_numbers  # 예약된 좌석 번호 리스트 (1A, 11C 형식)
    }

@router.put("/{bus_id}", response_model=BusSchema)
async def update_bus(
    bus_id: int,
    bus_update: BusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    # Update only provided fields
    update_data = bus_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bus, field, value)

    db.commit()
    db.refresh(bus)
    return bus

@router.delete("/{bus_id}")
async def delete_bus(
    bus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    # Soft delete by setting is_active to False
    bus.is_active = False
    db.commit()

    return {"message": "Bus deleted successfully"}

@router.get("/driver/my-buses")
async def get_driver_buses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Only drivers can access this endpoint")

    # Find all buses assigned to this driver
    buses = db.query(Bus).filter(
        Bus.driver_id == current_user.id,
        Bus.is_active == True
    ).all()

    if not buses:
        raise HTTPException(status_code=404, detail="No buses assigned to this driver")

    return buses

@router.get("/driver/my-bus")
async def get_driver_bus(
    current_user: User = Depends(get_current_user),
    reservation_date: str = None,
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Only drivers can access this endpoint")

    # Find bus assigned to this driver (keeping for backward compatibility)
    bus = db.query(Bus).filter(
        Bus.driver_id == current_user.id,
        Bus.is_active == True
    ).first()

    if not bus:
        raise HTTPException(status_code=404, detail="No bus assigned to this driver")

    # Calculate seat availability for the date
    target_date = date.today()
    if reservation_date:
        try:
            from datetime import datetime
            target_date = datetime.strptime(reservation_date, "%Y-%m-%d").date()
        except ValueError:
            target_date = date.today()

    reserved_count = db.query(Reservation).filter(
        Reservation.bus_id == bus.id,
        Reservation.reservation_date == target_date,
        Reservation.status == ReservationStatus.CONFIRMED
    ).count()

    available_seats = bus.total_seats - reserved_count
    occupancy_rate = (reserved_count / bus.total_seats) * 100 if bus.total_seats > 0 else 0

    return {
        "id": bus.id,
        "bus_number": bus.bus_number,
        "route": f"{bus.route.departure_location} → {bus.route.destination}" if bus.route else "",
        "departure_time": bus.departure_time.strftime("%H:%M"),
        "arrival_time": bus.arrival_time.strftime("%H:%M"),
        "destination": bus.route.destination if bus.route else "",
        "bus_type": f"{bus.total_seats}-seat",
        "total_seats": bus.total_seats,
        "available_seats": available_seats,
        "occupancy_rate": round(occupancy_rate, 1)
    }