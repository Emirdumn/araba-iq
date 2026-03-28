from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class GarageCar(Base):
    """User-added car for comparison — independent of the curated catalog."""

    __tablename__ = "garage_cars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    brand: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(128), nullable=False)
    variant: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mileage_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    listing_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    fuel_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    transmission: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    body_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    segment: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    horsepower: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engine_cc: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    combined_fuel_consumption: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    luggage_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    equipment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
