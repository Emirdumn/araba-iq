from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base


class PriceHistory(Base):
    __tablename__ = "price_histories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    car_variant_id: Mapped[int] = mapped_column(
        ForeignKey("car_variants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    avg_price: Mapped[Optional[float]] = mapped_column(Numeric(14, 2), nullable=True)
    median_price: Mapped[Optional[float]] = mapped_column(Numeric(14, 2), nullable=True)
    min_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sample_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    car_variant: Mapped["CarVariant"] = relationship(back_populates="price_histories")
