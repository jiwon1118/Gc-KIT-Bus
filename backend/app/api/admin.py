from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.core.database import get_db
from app.models.user import User
from app.models.bus import Bus, BusRoute
from app.models.reservation import Reservation, ReservationStatus
from app.api.auth import get_current_user
from datetime import date, datetime

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Get statistics
    total_users = db.query(User).count()
    total_buses = db.query(Bus).filter(Bus.is_active == True).count()
    total_routes = db.query(BusRoute).filter(BusRoute.is_active == True).count()
    
    today = date.today()
    today_reservations = db.query(Reservation).filter(
        Reservation.reservation_date == today,
        Reservation.status == ReservationStatus.CONFIRMED
    ).count()
    
    return {
        "total_users": total_users,
        "total_buses": total_buses,
        "total_routes": total_routes,
        "today_reservations": today_reservations
    }

@router.get("/occupancy")
async def get_occupancy_stats(
    reservation_date: date = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if not reservation_date:
        reservation_date = date.today()
    
    # Get occupancy rate for each bus
    occupancy_stats = []
    buses = db.query(Bus).filter(Bus.is_active == True).all()
    
    for bus in buses:
        reserved_count = db.query(Reservation).filter(
            Reservation.bus_id == bus.id,
            Reservation.reservation_date == reservation_date,
            Reservation.status == ReservationStatus.CONFIRMED
        ).count()
        
        occupancy_rate = (reserved_count / bus.total_seats) * 100 if bus.total_seats > 0 else 0
        
        occupancy_stats.append({
            "bus_id": bus.id,
            "bus_number": bus.bus_number,
            "route": bus.route.name if bus.route else "Unknown",
            "total_seats": bus.total_seats,
            "reserved_seats": reserved_count,
            "available_seats": bus.total_seats - reserved_count,
            "occupancy_rate": round(occupancy_rate, 2)
        })
    
    return {
        "date": reservation_date,
        "buses": occupancy_stats
    }

@router.post("/reservations/{reservation_id}/cancel")
async def admin_cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    reservation.status = ReservationStatus.CANCELLED
    reservation.cancelled_by = current_user.id
    db.commit()
    
    return {"message": "Reservation cancelled by admin"}

@router.post("/reservations/direct")
async def direct_booking(
    request_data: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user_id = request_data.get("user_id")
    bus_id = request_data.get("bus_id")
    seat_numbers = request_data.get("seat_numbers", [])
    reservation_date = request_data.get("reservation_date", str(date.today()))

    # Parse reservation_date if it's a string
    if isinstance(reservation_date, str):
        try:
            reservation_date = datetime.strptime(reservation_date, "%Y-%m-%d").date()
        except ValueError:
            reservation_date = date.today()

    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if bus exists
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    created_reservations = []

    for seat_number in seat_numbers:
        # Check if seat is already reserved
        existing_reservation = db.query(Reservation).filter(
            Reservation.bus_id == bus_id,
            Reservation.seat_number == seat_number,
            Reservation.reservation_date == reservation_date,
            Reservation.status == ReservationStatus.CONFIRMED
        ).first()

        if existing_reservation:
            raise HTTPException(status_code=400, detail=f"Seat {seat_number} already reserved")

        # Create reservation
        reservation = Reservation(
            user_id=user_id,
            bus_id=bus_id,
            seat_number=seat_number,
            reservation_date=reservation_date
        )
        db.add(reservation)
        created_reservations.append(reservation)

    db.commit()

    # Refresh all reservations
    for reservation in created_reservations:
        db.refresh(reservation)

    return created_reservations

@router.get("/reservations")
async def get_all_reservations(
    reservation_date: date = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Reservation)

    if reservation_date:
        query = query.filter(Reservation.reservation_date == reservation_date)

    reservations = query.all()
    return reservations

@router.get("/users")
async def get_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return users