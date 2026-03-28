from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CarVariant(Base):
    __tablename__ = "car_variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id", ondelete="CASCADE"), nullable=False, index=True)
    trim_name: Mapped[str] = mapped_column(String(256), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    fuel_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    transmission: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    engine_cc: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    horsepower: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    torque_nm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    drivetrain: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    combined_fuel_consumption: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    zero_to_hundred: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    top_speed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    seat_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    luggage_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    vehicle_model: Mapped["VehicleModel"] = relationship(back_populates="variants")
    listings: Mapped[list["MarketListing"]] = relationship(back_populates="car_variant")
    market_stat: Mapped[Optional["MarketStat"]] = relationship(
        "MarketStat", back_populates="car_variant", uselist=False
    )
    price_histories: Mapped[list["PriceHistory"]] = relationship(
        back_populates="car_variant", cascade="all, delete-orphan"
    )
    features: Mapped[list["CarFeature"]] = relationship(
        back_populates="car_variant", cascade="all, delete-orphan"
    )
