from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GarageCarBase(BaseModel):
    brand: str = Field(..., min_length=1, max_length=128)
    model: str = Field(..., min_length=1, max_length=128)
    variant: Optional[str] = Field(None, max_length=256)
    year: int = Field(..., ge=1970, le=2030)

    price: Optional[int] = Field(None, ge=0)
    mileage_km: Optional[int] = Field(None, ge=0)
    listing_url: Optional[str] = None

    fuel_type: Optional[str] = Field(None, max_length=32)
    transmission: Optional[str] = Field(None, max_length=32)
    body_type: Optional[str] = Field(None, max_length=64)
    segment: Optional[str] = Field(None, max_length=32)

    horsepower: Optional[int] = Field(None, ge=0)
    engine_cc: Optional[int] = Field(None, ge=0)
    combined_fuel_consumption: Optional[float] = Field(None, ge=0)
    luggage_capacity: Optional[int] = Field(None, ge=0)

    equipment: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: bool = False


class GarageCarCreate(GarageCarBase):
    pass


class GarageCarUpdate(BaseModel):
    brand: Optional[str] = Field(None, min_length=1, max_length=128)
    model: Optional[str] = Field(None, min_length=1, max_length=128)
    variant: Optional[str] = Field(None, max_length=256)
    year: Optional[int] = Field(None, ge=1970, le=2030)

    price: Optional[int] = Field(None, ge=0)
    mileage_km: Optional[int] = Field(None, ge=0)
    listing_url: Optional[str] = None

    fuel_type: Optional[str] = Field(None, max_length=32)
    transmission: Optional[str] = Field(None, max_length=32)
    body_type: Optional[str] = Field(None, max_length=64)
    segment: Optional[str] = Field(None, max_length=32)

    horsepower: Optional[int] = Field(None, ge=0)
    engine_cc: Optional[int] = Field(None, ge=0)
    combined_fuel_consumption: Optional[float] = Field(None, ge=0)
    luggage_capacity: Optional[int] = Field(None, ge=0)

    equipment: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None


class GarageCarRead(GarageCarBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
