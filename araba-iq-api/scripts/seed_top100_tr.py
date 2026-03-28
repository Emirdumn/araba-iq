#!/usr/bin/env python3
"""
Seed the catalog tables (brands, segments, models, car_variants) with
Turkey's top ~100 most-sold cars across common model years (2020-2025).

Usage:
  PYTHONPATH=. python scripts/seed_top100_tr.py
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import normalize_database_url

engine = create_engine(normalize_database_url(settings.database_url))

SEGMENTS = {
    "B-Sedan":   ("B-Sedan",   "technical", "Compact sedan"),
    "C-Sedan":   ("C-Sedan",   "technical", "Mid-size sedan"),
    "D-Sedan":   ("D-Sedan",   "technical", "Full-size sedan"),
    "B-HB":      ("B-HB",      "technical", "Compact hatchback"),
    "C-HB":      ("C-HB",      "technical", "Mid hatchback"),
    "B-SUV":     ("B-SUV",     "technical", "Compact SUV / Crossover"),
    "C-SUV":     ("C-SUV",     "technical", "Mid-size SUV"),
    "D-SUV":     ("D-SUV",     "technical", "Full-size SUV"),
    "MPV":       ("MPV",       "technical", "Multi-purpose vehicle"),
    "Pick-up":   ("Pick-up",   "technical", "Pick-up truck"),
    "E-Sedan":   ("E-Sedan",   "technical", "Executive sedan"),
    "Coupe":     ("Coupe",     "technical", "Coupe / Sports"),
}

BRANDS = {
    "Fiat":       "Italy",
    "Renault":    "France",
    "Toyota":     "Japan",
    "Volkswagen": "Germany",
    "Hyundai":    "South Korea",
    "Dacia":      "Romania",
    "Ford":       "USA",
    "Peugeot":    "France",
    "Opel":       "Germany",
    "Kia":        "South Korea",
    "Skoda":      "Czech Republic",
    "Honda":      "Japan",
    "Citroen":    "France",
    "BMW":        "Germany",
    "Mercedes":   "Germany",
    "Audi":       "Germany",
    "Nissan":     "Japan",
    "Suzuki":     "Japan",
    "MG":         "China",
    "Chery":      "China",
    "Seat":       "Spain",
    "Cupra":      "Spain",
    "Volvo":      "Sweden",
    "Mazda":      "Japan",
    "Mitsubishi": "Japan",
    "Jeep":       "USA",
    "Tesla":      "USA",
    "BYD":        "China",
    "Togg":       "Turkey",
}

# (brand, model_name, segment_key, body_type, variants)
# Each variant: (trim, year, fuel, trans, hp, cc, consumption_l100, luggage_l)
CATALOG = [
    ("Fiat", "Egea", "C-Sedan", "Sedan", [
        ("1.4 Fire", 2023, "Benzin", "Manuel", 95, 1368, 6.4, 510),
        ("1.0 Firefly", 2024, "Benzin", "Otomatik", 100, 999, 5.8, 510),
        ("1.6 MultiJet", 2023, "Dizel", "Otomatik", 130, 1598, 4.5, 510),
        ("1.0 Firefly", 2025, "Benzin", "Otomatik", 100, 999, 5.8, 510),
    ]),
    ("Fiat", "Egea Cross", "C-SUV", "Crossover", [
        ("1.0 Firefly Cross", 2024, "Benzin", "Otomatik", 100, 999, 6.2, 440),
        ("1.6 MultiJet Cross", 2024, "Dizel", "Otomatik", 130, 1598, 5.0, 440),
    ]),
    ("Fiat", "Egea HB", "C-HB", "Hatchback", [
        ("1.0 Firefly", 2024, "Benzin", "Otomatik", 100, 999, 5.6, 450),
        ("1.4 Fire", 2023, "Benzin", "Manuel", 95, 1368, 6.2, 450),
    ]),
    ("Renault", "Clio", "B-HB", "Hatchback", [
        ("1.0 TCe Joy", 2023, "Benzin", "Manuel", 90, 999, 5.2, 391),
        ("1.0 TCe Touch", 2024, "Benzin", "Otomatik", 100, 999, 5.4, 391),
        ("1.0 TCe Icon", 2025, "Benzin", "Otomatik", 100, 999, 5.3, 391),
    ]),
    ("Renault", "Megane", "C-Sedan", "Sedan", [
        ("1.3 TCe Joy", 2023, "Benzin", "Otomatik", 140, 1332, 5.9, 508),
        ("1.5 dCi Touch", 2023, "Dizel", "Otomatik", 115, 1461, 4.2, 508),
    ]),
    ("Renault", "Taliant", "B-Sedan", "Sedan", [
        ("1.0 TCe Joy", 2024, "Benzin", "Manuel", 90, 999, 5.3, 510),
        ("1.0 SCe Joy", 2023, "Benzin", "Manuel", 65, 999, 5.8, 510),
    ]),
    ("Dacia", "Duster", "B-SUV", "SUV", [
        ("1.0 TCe Comfort", 2024, "Benzin", "Manuel", 90, 999, 6.5, 445),
        ("1.5 dCi Comfort", 2024, "Dizel", "Manuel", 115, 1461, 5.3, 445),
        ("1.3 TCe Extreme", 2025, "Benzin", "Otomatik", 130, 1332, 6.8, 445),
    ]),
    ("Dacia", "Sandero", "B-HB", "Hatchback", [
        ("1.0 TCe Comfort", 2024, "Benzin", "Manuel", 90, 999, 5.0, 328),
        ("1.0 TCe Stepway", 2024, "Benzin", "Otomatik", 90, 999, 5.4, 328),
    ]),
    ("Toyota", "Corolla", "C-Sedan", "Sedan", [
        ("1.8 Hybrid Dream", 2024, "Hybrid", "Otomatik", 140, 1798, 4.3, 313),
        ("1.5 Vision", 2024, "Benzin", "Manuel", 123, 1496, 5.8, 313),
        ("2.0 Hybrid Flame", 2025, "Hybrid", "Otomatik", 196, 1987, 4.5, 313),
    ]),
    ("Toyota", "Corolla HB", "C-HB", "Hatchback", [
        ("1.8 Hybrid Dream", 2024, "Hybrid", "Otomatik", 140, 1798, 4.4, 313),
        ("2.0 Hybrid Flame", 2025, "Hybrid", "Otomatik", 196, 1987, 4.6, 313),
    ]),
    ("Toyota", "C-HR", "C-SUV", "SUV", [
        ("1.8 Hybrid Passion", 2024, "Hybrid", "Otomatik", 140, 1798, 4.7, 310),
        ("2.0 Hybrid GR Sport", 2025, "Hybrid", "Otomatik", 197, 1987, 4.9, 310),
    ]),
    ("Toyota", "Yaris", "B-HB", "Hatchback", [
        ("1.5 Hybrid Dream", 2024, "Hybrid", "Otomatik", 116, 1490, 3.8, 286),
    ]),
    ("Toyota", "Yaris Cross", "B-SUV", "SUV", [
        ("1.5 Hybrid Adventure", 2024, "Hybrid", "Otomatik", 116, 1490, 4.4, 320),
    ]),
    ("Toyota", "RAV4", "C-SUV", "SUV", [
        ("2.5 Hybrid Passion", 2024, "Hybrid", "Otomatik", 222, 2487, 5.6, 580),
    ]),
    ("Volkswagen", "Golf", "C-HB", "Hatchback", [
        ("1.0 TSI Life", 2024, "Benzin", "Otomatik", 110, 999, 5.4, 380),
        ("1.5 TSI Style", 2024, "Benzin", "Otomatik", 150, 1498, 5.7, 380),
        ("2.0 TDI Style", 2024, "Dizel", "Otomatik", 150, 1968, 4.3, 380),
    ]),
    ("Volkswagen", "Passat", "D-Sedan", "Sedan", [
        ("1.5 TSI Elegance", 2024, "Benzin", "Otomatik", 150, 1498, 5.9, 586),
        ("2.0 TDI Elegance", 2024, "Dizel", "Otomatik", 150, 1968, 4.6, 586),
    ]),
    ("Volkswagen", "T-Roc", "B-SUV", "SUV", [
        ("1.0 TSI Life", 2024, "Benzin", "Otomatik", 110, 999, 5.9, 392),
        ("1.5 TSI Style", 2024, "Benzin", "Otomatik", 150, 1498, 6.2, 392),
    ]),
    ("Volkswagen", "Tiguan", "C-SUV", "SUV", [
        ("1.5 TSI Life", 2024, "Benzin", "Otomatik", 150, 1498, 6.5, 615),
        ("2.0 TDI Elegance", 2024, "Dizel", "Otomatik", 150, 1968, 5.2, 615),
    ]),
    ("Hyundai", "i20", "B-HB", "Hatchback", [
        ("1.4 MPI Style", 2024, "Benzin", "Otomatik", 100, 1368, 5.7, 326),
    ]),
    ("Hyundai", "i10", "B-HB", "Hatchback", [
        ("1.0 MPI Jump", 2024, "Benzin", "Manuel", 67, 998, 4.8, 252),
    ]),
    ("Hyundai", "Bayon", "B-SUV", "Crossover", [
        ("1.0 T-GDI Style Plus", 2024, "Benzin", "Otomatik", 100, 998, 5.6, 411),
    ]),
    ("Hyundai", "Tucson", "C-SUV", "SUV", [
        ("1.6 T-GDI Elite", 2024, "Benzin", "Otomatik", 150, 1598, 7.0, 620),
        ("1.6 CRDi Elite", 2024, "Dizel", "Otomatik", 136, 1598, 5.3, 620),
        ("1.6 T-GDI HEV", 2025, "Hybrid", "Otomatik", 230, 1598, 5.2, 616),
    ]),
    ("Hyundai", "Kona", "B-SUV", "SUV", [
        ("1.0 T-GDI Style", 2024, "Benzin", "Otomatik", 120, 998, 5.8, 466),
        ("EV 65.4 kWh", 2024, "Elektrik", "Otomatik", 218, 0, 0.0, 466),
    ]),
    ("Ford", "Focus", "C-HB", "Hatchback", [
        ("1.0 EcoBoost Trend X", 2023, "Benzin", "Otomatik", 125, 999, 5.6, 375),
    ]),
    ("Ford", "Puma", "B-SUV", "Crossover", [
        ("1.0 EcoBoost ST-Line", 2024, "Benzin", "Otomatik", 125, 999, 5.8, 456),
    ]),
    ("Ford", "Kuga", "C-SUV", "SUV", [
        ("1.5 EcoBoost Titanium", 2024, "Benzin", "Otomatik", 150, 1498, 7.0, 475),
        ("2.5 PHEV ST-Line", 2024, "Hybrid", "Otomatik", 225, 2488, 1.2, 405),
    ]),
    ("Peugeot", "208", "B-HB", "Hatchback", [
        ("1.2 PureTech Active", 2024, "Benzin", "Otomatik", 100, 1199, 5.2, 309),
    ]),
    ("Peugeot", "2008", "B-SUV", "SUV", [
        ("1.2 PureTech Active", 2024, "Benzin", "Otomatik", 130, 1199, 5.8, 434),
    ]),
    ("Peugeot", "3008", "C-SUV", "SUV", [
        ("1.2 PureTech Allure", 2024, "Benzin", "Otomatik", 130, 1199, 6.4, 520),
        ("1.6 BlueHDi Allure", 2024, "Dizel", "Otomatik", 130, 1499, 4.7, 520),
    ]),
    ("Opel", "Corsa", "B-HB", "Hatchback", [
        ("1.2 Edition", 2024, "Benzin", "Manuel", 75, 1199, 5.5, 309),
        ("1.2 Turbo GS Line", 2024, "Benzin", "Otomatik", 100, 1199, 5.8, 309),
    ]),
    ("Opel", "Mokka", "B-SUV", "SUV", [
        ("1.2 Turbo GS Line", 2024, "Benzin", "Otomatik", 130, 1199, 6.1, 350),
    ]),
    ("Kia", "Ceed", "C-HB", "Hatchback", [
        ("1.5 T-GDI Cool", 2024, "Benzin", "Otomatik", 160, 1482, 6.0, 395),
    ]),
    ("Kia", "Sportage", "C-SUV", "SUV", [
        ("1.6 T-GDI Prestige", 2024, "Benzin", "Otomatik", 150, 1598, 7.1, 587),
        ("1.6 T-GDI HEV", 2024, "Hybrid", "Otomatik", 230, 1598, 5.3, 587),
    ]),
    ("Kia", "Stonic", "B-SUV", "Crossover", [
        ("1.0 T-GDI Cool", 2024, "Benzin", "Otomatik", 120, 998, 5.7, 352),
    ]),
    ("Skoda", "Octavia", "C-Sedan", "Sedan", [
        ("1.5 TSI Style", 2024, "Benzin", "Otomatik", 150, 1498, 5.6, 600),
        ("2.0 TDI Style", 2024, "Dizel", "Otomatik", 150, 1968, 4.2, 600),
    ]),
    ("Skoda", "Superb", "D-Sedan", "Sedan", [
        ("1.5 TSI Style", 2024, "Benzin", "Otomatik", 150, 1498, 5.8, 625),
    ]),
    ("Skoda", "Karoq", "B-SUV", "SUV", [
        ("1.5 TSI Style", 2024, "Benzin", "Otomatik", 150, 1498, 6.3, 521),
    ]),
    ("Honda", "Civic", "C-Sedan", "Sedan", [
        ("1.5 VTEC Turbo Elegance", 2024, "Benzin", "Otomatik", 182, 1498, 6.0, 410),
        ("2.0 e:HEV Advance", 2024, "Hybrid", "Otomatik", 184, 1993, 4.7, 410),
    ]),
    ("Honda", "HR-V", "B-SUV", "SUV", [
        ("1.5 e:HEV Advance", 2024, "Hybrid", "Otomatik", 131, 1498, 5.4, 319),
    ]),
    ("Citroen", "C3", "B-HB", "Hatchback", [
        ("1.2 PureTech Feel", 2024, "Benzin", "Manuel", 83, 1199, 5.1, 300),
    ]),
    ("Citroen", "C3 Aircross", "B-SUV", "SUV", [
        ("1.2 PureTech Feel", 2024, "Benzin", "Otomatik", 110, 1199, 5.8, 410),
    ]),
    ("BMW", "3 Serisi", "D-Sedan", "Sedan", [
        ("320i Sport Line", 2024, "Benzin", "Otomatik", 184, 1998, 6.5, 480),
        ("320d M Sport", 2024, "Dizel", "Otomatik", 190, 1995, 4.7, 480),
        ("330i M Sport", 2025, "Benzin", "Otomatik", 245, 1998, 6.8, 480),
    ]),
    ("BMW", "X1", "B-SUV", "SUV", [
        ("sDrive18i xLine", 2024, "Benzin", "Otomatik", 136, 1499, 6.6, 540),
    ]),
    ("BMW", "X3", "C-SUV", "SUV", [
        ("xDrive20i M Sport", 2024, "Benzin", "Otomatik", 184, 1998, 7.4, 550),
    ]),
    ("Mercedes", "C Serisi", "D-Sedan", "Sedan", [
        ("C 180 AMG", 2024, "Benzin", "Otomatik", 170, 1496, 6.6, 455),
        ("C 200 AMG", 2024, "Benzin", "Otomatik", 204, 1496, 6.8, 455),
        ("C 220d AMG", 2024, "Dizel", "Otomatik", 200, 1993, 4.8, 455),
    ]),
    ("Mercedes", "A Serisi", "C-HB", "Hatchback", [
        ("A 180 Style", 2024, "Benzin", "Otomatik", 136, 1332, 6.0, 370),
    ]),
    ("Mercedes", "GLC", "C-SUV", "SUV", [
        ("GLC 200 AMG", 2024, "Benzin", "Otomatik", 204, 1999, 7.6, 620),
    ]),
    ("Audi", "A3", "C-Sedan", "Sedan", [
        ("35 TFSI S Line", 2024, "Benzin", "Otomatik", 150, 1498, 5.7, 425),
    ]),
    ("Audi", "Q3", "B-SUV", "SUV", [
        ("35 TFSI Advanced", 2024, "Benzin", "Otomatik", 150, 1498, 6.6, 530),
    ]),
    ("Nissan", "Qashqai", "C-SUV", "SUV", [
        ("1.3 DIG-T Tekna", 2024, "Benzin", "Otomatik", 158, 1332, 6.3, 504),
    ]),
    ("Nissan", "Juke", "B-SUV", "Crossover", [
        ("1.0 DIG-T N-Connecta", 2024, "Benzin", "Otomatik", 114, 999, 5.8, 354),
    ]),
    ("Suzuki", "Vitara", "B-SUV", "SUV", [
        ("1.4 Boosterjet GLX", 2024, "Benzin", "Otomatik", 129, 1373, 5.8, 375),
    ]),
    ("Suzuki", "S-Cross", "B-SUV", "SUV", [
        ("1.4 Boosterjet GLX", 2024, "Benzin", "Otomatik", 129, 1373, 5.6, 430),
    ]),
    ("MG", "ZS", "B-SUV", "SUV", [
        ("1.5 VTi Luxury", 2024, "Benzin", "Manuel", 106, 1498, 6.5, 443),
        ("EV Luxury", 2024, "Elektrik", "Otomatik", 177, 0, 0.0, 448),
    ]),
    ("MG", "HS", "C-SUV", "SUV", [
        ("1.5 Turbo Luxury", 2024, "Benzin", "Otomatik", 162, 1490, 7.0, 463),
    ]),
    ("Chery", "Tiggo 4 Pro", "B-SUV", "SUV", [
        ("1.5 Turbo Luxury", 2024, "Benzin", "Otomatik", 147, 1498, 6.8, 340),
    ]),
    ("Chery", "Tiggo 7 Pro", "C-SUV", "SUV", [
        ("1.5 Turbo Luxury", 2024, "Benzin", "Otomatik", 147, 1498, 7.3, 475),
    ]),
    ("Seat", "Leon", "C-HB", "Hatchback", [
        ("1.5 TSI Style", 2024, "Benzin", "Otomatik", 150, 1498, 5.6, 380),
    ]),
    ("Seat", "Arona", "B-SUV", "Crossover", [
        ("1.0 TSI Style", 2024, "Benzin", "Otomatik", 110, 999, 5.6, 400),
    ]),
    ("Cupra", "Formentor", "C-SUV", "SUV", [
        ("1.5 TSI VZ", 2024, "Benzin", "Otomatik", 150, 1498, 6.4, 450),
    ]),
    ("Volvo", "XC40", "B-SUV", "SUV", [
        ("B3 Plus", 2024, "Benzin", "Otomatik", 163, 1969, 7.0, 452),
    ]),
    ("Volvo", "XC60", "C-SUV", "SUV", [
        ("B4 Plus", 2024, "Benzin", "Otomatik", 197, 1969, 7.3, 483),
    ]),
    ("Mazda", "CX-5", "C-SUV", "SUV", [
        ("2.0 SkyActiv-G Power", 2024, "Benzin", "Otomatik", 165, 1998, 7.1, 506),
    ]),
    ("Mazda", "CX-30", "B-SUV", "SUV", [
        ("2.0 SkyActiv-G Power", 2024, "Benzin", "Otomatik", 150, 1998, 6.4, 430),
    ]),
    ("Mitsubishi", "ASX", "B-SUV", "SUV", [
        ("1.0 Turbo Invite", 2024, "Benzin", "Otomatik", 91, 999, 5.6, 422),
    ]),
    ("Jeep", "Renegade", "B-SUV", "SUV", [
        ("1.3 Turbo Limited", 2024, "Benzin", "Otomatik", 150, 1332, 6.5, 351),
    ]),
    ("Jeep", "Compass", "C-SUV", "SUV", [
        ("1.3 Turbo Limited", 2024, "Benzin", "Otomatik", 150, 1332, 6.9, 438),
    ]),
    ("Tesla", "Model Y", "C-SUV", "SUV", [
        ("Long Range AWD", 2024, "Elektrik", "Otomatik", 351, 0, 0.0, 854),
        ("Performance", 2024, "Elektrik", "Otomatik", 462, 0, 0.0, 854),
    ]),
    ("Tesla", "Model 3", "C-Sedan", "Sedan", [
        ("Long Range AWD", 2024, "Elektrik", "Otomatik", 350, 0, 0.0, 561),
    ]),
    ("BYD", "Atto 3", "B-SUV", "SUV", [
        ("Comfort 60.5 kWh", 2024, "Elektrik", "Otomatik", 204, 0, 0.0, 440),
    ]),
    ("BYD", "Seal", "C-Sedan", "Sedan", [
        ("Design 82.5 kWh", 2024, "Elektrik", "Otomatik", 313, 0, 0.0, 400),
    ]),
    ("Togg", "T10X", "C-SUV", "SUV", [
        ("RWD Standard", 2024, "Elektrik", "Otomatik", 200, 0, 0.0, 460),
        ("RWD Long Range", 2025, "Elektrik", "Otomatik", 218, 0, 0.0, 460),
    ]),
]


def get_or_create_segment(conn, name, cat, desc):
    row = conn.execute(text("SELECT id FROM segments WHERE name = :n"), {"n": name}).fetchone()
    if row:
        return row[0]
    conn.execute(text("INSERT INTO segments (name, category_type, description) VALUES (:n, :c, :d)"),
                 {"n": name, "c": cat, "d": desc})
    return conn.execute(text("SELECT id FROM segments WHERE name = :n"), {"n": name}).fetchone()[0]


def get_or_create_brand(conn, name, country):
    row = conn.execute(text("SELECT id FROM brands WHERE name = :n"), {"n": name}).fetchone()
    if row:
        return row[0]
    conn.execute(text("INSERT INTO brands (name, country, is_active) VALUES (:n, :c, true)"),
                 {"n": name, "c": country})
    return conn.execute(text("SELECT id FROM brands WHERE name = :n"), {"n": name}).fetchone()[0]


def get_or_create_model(conn, brand_id, segment_id, name, body_type):
    row = conn.execute(
        text("SELECT id FROM models WHERE brand_id = :b AND name = :n"),
        {"b": brand_id, "n": name},
    ).fetchone()
    if row:
        return row[0]
    conn.execute(
        text("INSERT INTO models (brand_id, segment_id, name, body_type) VALUES (:b, :s, :n, :bt)"),
        {"b": brand_id, "s": segment_id, "n": name, "bt": body_type},
    )
    return conn.execute(
        text("SELECT id FROM models WHERE brand_id = :b AND name = :n"),
        {"b": brand_id, "n": name},
    ).fetchone()[0]


def variant_exists(conn, model_id, trim, year):
    return conn.execute(
        text("SELECT 1 FROM car_variants WHERE model_id = :m AND trim_name = :t AND year = :y"),
        {"m": model_id, "t": trim, "y": year},
    ).fetchone() is not None


def main():
    total_variants = 0
    with engine.begin() as conn:
        seg_cache = {}
        brand_cache = {}

        for brand_name, model_name, seg_key, body_type, variants in CATALOG:
            if seg_key not in seg_cache:
                sn, sc, sd = SEGMENTS[seg_key]
                seg_cache[seg_key] = get_or_create_segment(conn, sn, sc, sd)
            seg_id = seg_cache[seg_key]

            if brand_name not in brand_cache:
                brand_cache[brand_name] = get_or_create_brand(conn, brand_name, BRANDS.get(brand_name, ""))
            brand_id = brand_cache[brand_name]

            model_id = get_or_create_model(conn, brand_id, seg_id, model_name, body_type)

            for trim, year, fuel, trans, hp, cc, cons, luggage in variants:
                if variant_exists(conn, model_id, trim, year):
                    continue
                conn.execute(text("""
                    INSERT INTO car_variants
                        (model_id, trim_name, year, fuel_type, transmission,
                         engine_cc, horsepower, combined_fuel_consumption, luggage_capacity)
                    VALUES (:m, :t, :y, :f, :tr, :cc, :hp, :cons, :lug)
                """), {
                    "m": model_id, "t": trim, "y": year, "f": fuel, "tr": trans,
                    "cc": cc if cc else None, "hp": hp, "cons": cons if cons else None,
                    "lug": luggage,
                })
                total_variants += 1

        brand_count = conn.execute(text("SELECT COUNT(*) FROM brands")).scalar()
        model_count = conn.execute(text("SELECT COUNT(*) FROM models")).scalar()
        variant_count = conn.execute(text("SELECT COUNT(*) FROM car_variants")).scalar()

    print(f"Seed complete:")
    print(f"  Brands:   {brand_count}")
    print(f"  Models:   {model_count}")
    print(f"  Variants: {variant_count} (+{total_variants} new)")


if __name__ == "__main__":
    main()
