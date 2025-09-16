from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import User as UserSchema
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    users = db.query(User).all()
    return users

@router.get("/drivers", response_model=List[UserSchema])
async def get_drivers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    drivers = db.query(User).filter(User.role == UserRole.DRIVER, User.is_active == True).all()
    return drivers

@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user