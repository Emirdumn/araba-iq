from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.garage_car import GarageCar
from app.schemas.garage import GarageCarCreate, GarageCarRead, GarageCarUpdate

router = APIRouter(prefix="/garage", tags=["garage"])


@router.get("", response_model=list[GarageCarRead])
def list_garage_cars(db: Session = Depends(get_db)) -> list[GarageCar]:
    stmt = select(GarageCar).order_by(GarageCar.updated_at.desc())
    return list(db.scalars(stmt).all())


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
