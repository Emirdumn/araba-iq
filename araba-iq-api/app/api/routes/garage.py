from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.garage_car import GarageCar
from app.schemas.garage import GarageCarCreate, GarageCarRead, GarageCarUpdate

router = APIRouter(prefix="/garage", tags=["garage"])


@router.get("")
def list_garage_cars(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, max_length=100),
) -> dict:
    base = select(GarageCar)
    if search:
        like = f"%{search}%"
        base = base.where(
            GarageCar.brand.ilike(like) | GarageCar.model.ilike(like)
        )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(GarageCar.updated_at.desc()).offset(offset).limit(limit)
    cars = list(db.scalars(stmt).all())
    return {
        "items": [GarageCarRead.model_validate(c) for c in cars],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.post("", response_model=GarageCarRead, status_code=201)
def create_garage_car(payload: GarageCarCreate, db: Session = Depends(get_db)) -> GarageCar:
    car = GarageCar(**payload.model_dump())
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@router.get("/{car_id}", response_model=GarageCarRead)
def get_garage_car(car_id: int, db: Session = Depends(get_db)) -> GarageCar:
    car = db.get(GarageCar, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Garage car not found")
    return car


@router.patch("/{car_id}", response_model=GarageCarRead)
def update_garage_car(car_id: int, payload: GarageCarUpdate, db: Session = Depends(get_db)) -> GarageCar:
    car = db.get(GarageCar, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Garage car not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(car, field, value)
    db.commit()
    db.refresh(car)
    return car


@router.delete("/{car_id}", status_code=204)
def delete_garage_car(car_id: int, db: Session = Depends(get_db)) -> None:
    car = db.get(GarageCar, car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Garage car not found")
    db.delete(car)
    db.commit()
