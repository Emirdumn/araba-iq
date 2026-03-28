#!/usr/bin/env python3
"""
Import Turkey Car Market 2020 Kaggle dataset into garage_cars table.

Usage:
  pip install kagglehub pandas
  PYTHONPATH=. python scripts/import_kaggle_cars.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import kagglehub
from kagglehub import KaggleDatasetAdapter
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import normalize_database_url

BRAND_BODY_MAP = {
    "Sedan": "Sedan",
    "Hatchback": "Hatchback",
    "Hatchback 3 Kapı": "Hatchback",
    "Hatchback 5 Kapı": "Hatchback",
    "Station wagon": "Station Wagon",
    "Station Wagon": "Station Wagon",
    "Cabrio": "Cabrio",
    "Coupe": "Coupe",
    "MPV": "MPV",
    "SUV": "SUV",
    "Pick-up": "Pick-up",
}

FUEL_MAP = {
    "Benzin": "Benzin",
    "Dizel": "Dizel",
    "Hibrit": "Hybrid",
    "LPG & Benzin": "LPG",
    "Elektrik": "Elektrik",
    "Benzin & LPG": "LPG",
}

TRANS_MAP = {
    "Düz": "Manuel",
    "Otomatik": "Otomatik",
    "Yarı Otomatik": "Yarı Otomatik",
}


def clean_int(val) -> int | None:
    if val is None or (hasattr(val, "__class__") and val.__class__.__name__ == "NaN"):
        return None
    import math
    try:
        v = float(val)
        if math.isnan(v):
            return None
        return int(v)
    except (ValueError, TypeError):
        return None


def main():
    print("Loading dataset from Kaggle...")
    df = kagglehub.load_dataset(
        KaggleDatasetAdapter.PANDAS,
        "alpertemel/turkey-car-market-2020",
        "",
    )

    print(f"Dataset loaded: {len(df)} rows, columns: {list(df.columns)}")
    print(df.head(3))

    engine = create_engine(normalize_database_url(settings.database_url))

    rows = []
    for _, row in df.iterrows():
        brand = str(row.get("Marka", "")).strip()
        model = str(row.get("Arac.Tip", "") or row.get("Arac Tip", "")).strip()
        if not brand or not model or brand == "nan" or model == "nan":
            continue

        year = clean_int(row.get("Model.Yıl") or row.get("Model Yıl"))
        if year is None or year < 1970 or year > 2030:
            continue

        price = clean_int(row.get("Fiyat"))
        km = clean_int(row.get("Km"))
        hp = clean_int(row.get("Beygir.Gucu") or row.get("Beygir Gucu"))
        cc = clean_int(row.get("CCM"))

        fuel_raw = str(row.get("Yakıt.Turu") or row.get("Yakıt Turu") or "").strip()
        fuel = FUEL_MAP.get(fuel_raw, fuel_raw if fuel_raw and fuel_raw != "nan" else None)

        trans_raw = str(row.get("Vites", "")).strip()
        trans = TRANS_MAP.get(trans_raw, trans_raw if trans_raw and trans_raw != "nan" else None)

        body_raw = str(row.get("Kasa.Tipi") or row.get("Kasa Tipi") or "").strip()
        body = BRAND_BODY_MAP.get(body_raw, body_raw if body_raw and body_raw != "nan" else None)

        rows.append({
            "brand": brand,
            "model": model,
            "year": year,
            "price": price,
            "mileage_km": km,
            "fuel_type": fuel,
            "transmission": trans,
            "body_type": body,
            "horsepower": hp,
            "engine_cc": cc,
            "is_favorite": False,
        })

    print(f"Prepared {len(rows)} valid cars for import.")

    if not rows:
        print("No rows to import. Check column names.")
        return

    with engine.begin() as conn:
        existing = conn.execute(text("SELECT COUNT(*) FROM garage_cars")).scalar()
        print(f"Existing garage_cars rows: {existing}")

        for r in rows:
            conn.execute(
                text("""
                    INSERT INTO garage_cars
                        (brand, model, year, price, mileage_km, fuel_type, transmission,
                         body_type, horsepower, engine_cc, is_favorite, created_at, updated_at)
                    VALUES
                        (:brand, :model, :year, :price, :mileage_km, :fuel_type, :transmission,
                         :body_type, :horsepower, :engine_cc, :is_favorite, NOW(), NOW())
                """),
                r,
            )

        new_count = conn.execute(text("SELECT COUNT(*) FROM garage_cars")).scalar()
        print(f"Import complete. Total garage_cars: {new_count} (+{new_count - existing})")


if __name__ == "__main__":
    main()
