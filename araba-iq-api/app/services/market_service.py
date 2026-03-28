from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.market_listing import MarketListing
from app.models.market_stat import MarketStat
from app.models.price_history import PriceHistory
from app.utils.stats import mean, median, pearson_price_mileage, pstdev, pvariance


def list_listings(
    db: Session,
    car_variant_id: int,
    city: Optional[str] = None,
    seller_type: Optional[str] = None,
    limit: int = 20,
) -> list[MarketListing]:
    lim = max(1, min(limit, 100))
    stmt = select(MarketListing).where(
        MarketListing.car_variant_id == car_variant_id,
        MarketListing.is_active.is_(True),
    )
    if city:
        stmt = stmt.where(MarketListing.city == city)
    if seller_type:
        stmt = stmt.where(MarketListing.seller_type == seller_type)
    stmt = stmt.order_by(MarketListing.price.asc(), MarketListing.id).limit(lim)
    return list(db.scalars(stmt).all())


def _aggregate_listings(listings: list[MarketListing]) -> dict[str, Any]:
    prices = [float(l.price) for l in listings]
    n = len(prices)
    std = pstdev(prices)
    var = pvariance(prices)
    avg = mean(prices)
    med = median(prices)
    pairs_p: list[float] = []
    pairs_m: list[float] = []
    for l in listings:
        if l.mileage_km is not None:
            pairs_p.append(float(l.price))
            pairs_m.append(float(l.mileage_km))
    corr = None
    if len(pairs_p) >= 3 and len(pairs_p) == len(pairs_m):
        corr = pearson_price_mileage(pairs_p, pairs_m)
    return {
        "sample_size": n,
        "avg_price": avg,
        "median_price": med,
        "min_price": int(min(prices)),
        "max_price": int(max(prices)),
        "std_dev_price": std,
        "variance_price": var,
        "avg_mileage": mean(pairs_m) if pairs_m else None,
        "price_mileage_corr": corr,
    }


def upsert_market_stat(db: Session, car_variant_id: int, listings: list[MarketListing]) -> MarketStat:
    if not listings:
        raise ValueError("listing yok")
    agg = _aggregate_listings(listings)
    now = datetime.now(timezone.utc)
    existing = db.scalars(select(MarketStat).where(MarketStat.car_variant_id == car_variant_id)).one_or_none()
    if existing is None:
        row = MarketStat(
            car_variant_id=car_variant_id,
            sample_size=agg["sample_size"],
            avg_price=agg["avg_price"],
            median_price=agg["median_price"],
            min_price=agg["min_price"],
            max_price=agg["max_price"],
            std_dev_price=agg["std_dev_price"],
            variance_price=agg["variance_price"],
            avg_mileage=agg["avg_mileage"],
            price_mileage_corr=agg["price_mileage_corr"],
            calculated_at=now,
        )
        db.add(row)
        
        # Record history for new stat
        history_row = PriceHistory(
            car_variant_id=car_variant_id,
            avg_price=agg["avg_price"],
            median_price=agg["median_price"],
            min_price=agg["min_price"],
            max_price=agg["max_price"],
            sample_size=agg["sample_size"],
            recorded_at=now,
        )
        db.add(history_row)
        
        return row
    existing.sample_size = agg["sample_size"]
    existing.avg_price = agg["avg_price"]
    existing.median_price = agg["median_price"]
    existing.min_price = agg["min_price"]
    existing.max_price = agg["max_price"]
    existing.std_dev_price = agg["std_dev_price"]
    existing.variance_price = agg["variance_price"]
    existing.avg_mileage = agg["avg_mileage"]
    existing.price_mileage_corr = agg["price_mileage_corr"]
    existing.calculated_at = now
    
    # Also record history
    history_row = PriceHistory(
        car_variant_id=car_variant_id,
        avg_price=agg["avg_price"],
        median_price=agg["median_price"],
        min_price=agg["min_price"],
        max_price=agg["max_price"],
        sample_size=agg["sample_size"],
        recorded_at=now,
    )
    db.add(history_row)

    return existing


def refresh_all_market_stats(db: Session) -> int:
    """Aktif ilanı olan tüm varyantlar için market_stats güncelle. Dönen: işlenen varyant sayısı."""
    stmt = (
        select(MarketListing.car_variant_id)
        .where(MarketListing.is_active.is_(True))
        .distinct()
    )
    variant_ids = list(db.scalars(stmt).all())
    count = 0
    try:
        for vid in variant_ids:
            listings = list(
                db.scalars(
                    select(MarketListing).where(
                        MarketListing.car_variant_id == vid,
                        MarketListing.is_active.is_(True),
                    )
                ).all()
            )
            if not listings:
                continue
            upsert_market_stat(db, vid, listings)
            count += 1
        db.commit()
    except Exception:
        db.rollback()
        raise
    return count
