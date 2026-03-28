#!/usr/bin/env python3
"""
Apply Turkish ÖTV + KDV taxes to 2025 dataset cars (garage_cars with year=2025).

Turkish tax structure (2025):
- ÖTV (Özel Tüketim Vergisi) depends on engine_cc and base price
- KDV (Katma Değer Vergisi) = 20% on (base_price + ÖTV)

Formula: final = (base + ÖTV) * 1.20

ÖTV rates for ICE vehicles:
  ≤1400cc: 80% (matrah ≤1.1M) / 90% (>1.1M)
  1401-1600cc: 80-100%
  1601-2000cc: 150-170%
  >2000cc: 220%

Electric vehicles: 25-75% depending on battery/price
Hybrid: 70-80% (small engine) / 150% (large engine)

Usage:
  PYTHONPATH=. python scripts/apply_turkey_taxes.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import normalize_database_url

engine = create_engine(normalize_database_url(settings.database_url))


def get_otv_rate(engine_cc: int | None, fuel_type: str | None, base_price: int | None) -> float:
    fuel = (fuel_type or "").lower()
    cc = engine_cc or 0
    bp = base_price or 0

    if "elektrik" in fuel or "electric" in fuel:
        if bp <= 700_000:
            return 0.25
        elif bp <= 1_200_000:
            return 0.55
        elif bp <= 1_800_000:
            return 0.65
        else:
            return 0.75

    if "hybrid" in fuel or "hibrit" in fuel:
        if cc <= 1600:
            return 0.75
        elif cc <= 2000:
            return 1.50
        else:
            return 2.20

    if cc <= 1400:
        if bp <= 900_000:
            return 0.75
        elif bp <= 1_100_000:
            return 0.80
        else:
            return 0.90

    if cc <= 1600:
        if bp <= 850_000:
            return 0.75
        elif bp <= 1_100_000:
            return 0.80
        elif bp <= 1_650_000:
            return 0.90
        else:
            return 1.00

    if cc <= 2000:
        if bp <= 1_650_000:
            return 1.50
        else:
            return 1.70

    return 2.20


def calculate_turkey_price(base_price: int, engine_cc: int | None, fuel_type: str | None) -> dict:
    otv_rate = get_otv_rate(engine_cc, fuel_type, base_price)
    otv = int(base_price * otv_rate)
    subtotal = base_price + otv
    kdv = int(subtotal * 0.20)
    total = subtotal + kdv
    return {
        "base": base_price,
        "otv_rate": otv_rate,
        "otv": otv,
        "kdv": kdv,
        "total": total,
    }


def main():
    print("=== Applying Turkey ÖTV + KDV to 2025 cars ===")

    with engine.begin() as conn:
        rows = conn.execute(text(
            "SELECT id, brand, model, price, engine_cc, fuel_type FROM garage_cars WHERE year = 2025 AND price IS NOT NULL"
        )).fetchall()

        print(f"Found {len(rows)} cars with prices to update")

        updated = 0
        for row in rows:
            car_id, brand, model, current_price, cc, fuel = row

            base = current_price
            result = calculate_turkey_price(base, cc, fuel)
            new_price = result["total"]

            if new_price == current_price:
                continue

            otv_pct = int(result["otv_rate"] * 100)
            note = f"ÖTV %{otv_pct} + KDV %20 | Vergisiz: {base:,} TL | ÖTV: {result['otv']:,} TL | KDV: {result['kdv']:,} TL"

            conn.execute(
                text("UPDATE garage_cars SET price = :p, notes = :n WHERE id = :id"),
                {"p": new_price, "n": note, "id": car_id},
            )
            updated += 1

            if updated <= 10:
                print(f"  {brand} {model}: {base:>12,} -> {new_price:>12,} TL (ÖTV %{otv_pct})")

        if updated > 10:
            print(f"  ... and {updated - 10} more")

        print(f"\nUpdated {updated} cars with Turkish taxes")


if __name__ == "__main__":
    main()
