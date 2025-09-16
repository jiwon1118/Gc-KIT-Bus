import re
from datetime import datetime, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.bus import Bus
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.reservation import Reservation as ReservationSchema, ReservationCreate, ReservationUpdate
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ReservationSchema])
async def get_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value == "admin":
        reservations = db.query(Reservation).all()
    elif current_user.role.value == "driver":
        # 기사님은 자신이 담당하는 버스의 모든 예약을 볼 수 있음
        reservations = db.query(Reservation).join(Bus).filter(Bus.driver_id == current_user.id).all()
    else:
        # 일반 사용자는 자신의 예약만
        reservations = db.query(Reservation).filter(Reservation.user_id == current_user.id).all()

    return reservations

@router.get("/user")
async def get_user_reservations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservations = db.query(Reservation).filter(
        Reservation.user_id == current_user.id
    ).join(Bus).all()

    result = []
    for reservation in reservations:
        reservation_data = {
            "id": reservation.id,
            "user_id": reservation.user_id,
            "bus_id": reservation.bus_id,
            "seat_number": reservation.seat_number,
            "reservation_date": reservation.reservation_date.isoformat() if reservation.reservation_date else "",
            "departure_time": reservation.bus.departure_time.strftime("%H:%M") if reservation.bus else "",
            "status": reservation.status.value if reservation.status else "confirmed",
            "bus_number": reservation.bus.bus_number if reservation.bus else "",
            "route": f"{reservation.bus.route.departure_location} → {reservation.bus.route.destination}" if reservation.bus and reservation.bus.route else "",
            "bus_type": reservation.bus.bus_type.value if reservation.bus and reservation.bus.bus_type else "28-seat",
            "full_name": current_user.full_name,
            "phone": current_user.phone
        }
        result.append(reservation_data)

    return result

@router.post("/")
async def create_reservation(
    reservation_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"Received reservation data: {reservation_data}")  # Debug logging

    # Check if bus exists
    bus = db.query(Bus).filter(Bus.id == reservation_data["bus_id"]).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    seat_numbers = reservation_data["seat_numbers"]
    reservation_date_str = reservation_data["reservation_date"]

    # Convert date string to date object
    try:
        reservation_date = datetime.strptime(reservation_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Check if seats are already reserved
    existing_reservations = db.query(Reservation).filter(
        Reservation.bus_id == reservation_data["bus_id"],
        Reservation.seat_number.in_(seat_numbers),
        Reservation.reservation_date == reservation_date,
        Reservation.status == ReservationStatus.CONFIRMED
    ).all()

    if existing_reservations:
        reserved_seats = [r.seat_number for r in existing_reservations]
        raise HTTPException(status_code=400, detail=f"Seats already reserved: {reserved_seats}")

    # Validate seat numbers (format: "1A", "2B", etc.)
    valid_seat_pattern = re.compile(r'^\d+[A-D]$')
    invalid_seats = [seat for seat in seat_numbers if not valid_seat_pattern.match(seat)]
    if invalid_seats:
        raise HTTPException(status_code=400, detail=f"Invalid seat numbers: {invalid_seats}")

    # Create reservations
    created_reservations = []
    for seat_number in seat_numbers:
        reservation = Reservation(
            user_id=current_user.id,
            bus_id=reservation_data["bus_id"],
            seat_number=seat_number,
            reservation_date=reservation_date,
            status=ReservationStatus.CONFIRMED
        )
        db.add(reservation)
        created_reservations.append(reservation)

    db.commit()

    # Return reservation data in the format expected by frontend
    result = []
    for reservation in created_reservations:
        db.refresh(reservation)
        reservation_data = {
            "id": reservation.id,
            "user_id": reservation.user_id,
            "bus_id": reservation.bus_id,
            "seat_number": reservation.seat_number,
            "reservation_date": reservation.reservation_date.isoformat() if reservation.reservation_date else "",
            "departure_time": bus.departure_time.strftime("%H:%M"),
            "status": reservation.status.value,
            "bus_number": bus.bus_number,
            "route": f"{bus.route.departure_location} → {bus.route.destination}" if bus.route else "",
            "bus_type": bus.bus_type.value if bus.bus_type else "28-seat",
            "full_name": current_user.full_name,
            "phone": current_user.phone
        }
        result.append(reservation_data)

    return result

@router.get("/{reservation_id}", response_model=ReservationSchema)
async def get_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check permissions
    if current_user.role.value != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return reservation

@router.put("/{reservation_id}", response_model=ReservationSchema)
async def update_reservation(
    reservation_id: int,
    reservation_update: ReservationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check permissions
    if current_user.role.value != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Update reservation
    if reservation_update.status:
        reservation.status = reservation_update.status
        if reservation_update.status == ReservationStatus.CANCELLED:
            reservation.cancelled_by = current_user.id
    
    db.commit()
    db.refresh(reservation)
    return reservation

@router.delete("/{reservation_id}")
async def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check permissions
    if current_user.role.value != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    reservation.status = ReservationStatus.CANCELLED
    reservation.cancelled_by = current_user.id
    db.commit()
    
    return {"message": "Reservation cancelled successfully"}