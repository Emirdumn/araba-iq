from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PriceHistory(Base):
    """Weekly price snapshot for a car_variant, populated by cron."""

    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    car_variant_id: Mapped[int] = mapped_column(
        ForeignKey("car_variants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False, default="sahibinden")
    sample_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    min_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    median_price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    car_variant: Mapped["CarVariant"] = relationship()
