#!/usr/bin/env python3
"""
Import Cars Datasets 2025 (Kaggle: abdulmalik1518) into garage_cars.
Skips duplicates based on (brand, model) match.

Usage:
  PYTHONPATH=. python scripts/import_cars2025.py
"""

import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import normalize_database_url

engine = create_engine(normalize_database_url(settings.database_url))

CSV_PATH = "/root/.cache/kagglehub/datasets/abdulmalik1518/cars-datasets-2025/versions/1/Cars Datasets 2025.csv"

FUEL_MAP = {
    "petrol": "Benzin",
    "diesel": "Dizel",
    "hybrid": "Hybrid",
    "plug in hyrbrid": "Hybrid",
    "plug-in hybrid": "Hybrid",
    "electric": "Elektrik",
    "cng": "LPG",
    "mild hybrid": "Hybrid",
    "phev": "Hybrid",
}


def parse_hp(raw):
    if pd.isna(raw):
        return None
    m = re.search(r"(\d[\d,]*)", str(raw).replace(",", ""))
    return int(m.group(1)) if m else None


def parse_cc(raw):
    if pd.isna(raw):
        return None
    txt = str(raw).lower().replace(",", "")
    m = re.search(r"(\d+)\s*cc", txt)
    if m:
        return int(m.group(1))
    m2 = re.search(r"(\d+\.?\d*)\s*kwh", txt)
    if m2:
        return None
    return None


def parse_price_usd(raw):
    if pd.isna(raw):
        return None
    txt = str(raw).replace(",", "").replace("$", "").strip()
    m = re.search(r"(\d+)", txt)
    if not m:
        return None
    usd = int(m.group(1))
    if usd < 500:
        return None
    tl = int(usd * 38)
    return tl


def parse_speed(raw):
    if pd.isna(raw):
        return None
    m = re.search(r"(\d+)", str(raw))
    return int(m.group(1)) if m else None


def parse_zero100(raw):
    if pd.isna(raw):
        return None
    m = re.search(r"([\d.]+)", str(raw))
    return float(m.group(1)) if m else None


def parse_seats(raw):
    if pd.isna(raw):
        return None
    m = re.search(r"(\d+)", str(raw))
    return int(m.group(1)) if m else None


def parse_torque(raw):
    if pd.isna(raw):
        return None
    m = re.search(r"(\d[\d,]*)", str(raw).replace(",", ""))
    return int(m.group(1)) if m else None


def clean_brand(raw):
    return str(raw).strip().title()


def clean_model(raw):
    return str(raw).strip()


def main():
    print("Loading CSV...")
    df = pd.read_csv(CSV_PATH, encoding="latin-1")
    print(f"Loaded {len(df)} rows")

    with engine.begin() as conn:
        existing = conn.execute(text(
            "SELECT LOWER(brand) || '|' || LOWER(model) FROM garage_cars"
        )).fetchall()
        existing_keys = set(r[0] for r in existing)
        print(f"Existing garage_cars: {len(existing_keys)} unique brand|model combos")

    rows = []
    skipped = 0
    for _, r in df.iterrows():
        brand = clean_brand(r.get("Company Names", ""))
        model = clean_model(r.get("Cars Names", ""))
        if not brand or not model or brand.lower() == "nan" or model.lower() == "nan":
            continue

        key = f"{brand.lower()}|{model.lower()}"
        if key in existing_keys:
            skipped += 1
            continue
        existing_keys.add(key)

        fuel_raw = str(r.get("Fuel Types", "")).strip().lower()
        fuel = FUEL_MAP.get(fuel_raw, fuel_raw.title() if fuel_raw and fuel_raw != "nan" else None)

        rows.append({
            "brand": brand,
            "model": model,
            "year": 2025,
            "price": parse_price_usd(r.get("Cars Prices")),
            "fuel_type": fuel,
            "horsepower": parse_hp(r.get("HorsePower")),
            "engine_cc": parse_cc(r.get("CC/Battery Capacity")),
            "is_favorite": False,
        })

    print(f"New cars to import: {len(rows)} (skipped {skipped} duplicates)")

    if not rows:
        print("Nothing to import.")
        return

    with engine.begin() as conn:
        for row in rows:
            conn.execute(text("""
                INSERT INTO garage_cars
                    (brand, model, year, price, fuel_type, horsepower, engine_cc, is_favorite, created_at, updated_at)
                VALUES
                    (:brand, :model, :year, :price, :fuel_type, :horsepower, :engine_cc, :is_favorite, NOW(), NOW())
            """), row)

        total = conn.execute(text("SELECT COUNT(*) FROM garage_cars")).scalar()
        print(f"Import complete. Total garage_cars: {total} (+{len(rows)} new)")


if __name__ == "__main__":
    main()
