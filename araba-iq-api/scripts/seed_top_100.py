"""
Türkiye'de en çok satılan 100 popüler aracı (marka, model ve popüler varyantlarıyla) veritabanına ekler.
Cron job'un güncel fiyatları Sahibinden'den çekebilmesi için temel altyapıyı oluşturur.
"""

from __future__ import annotations

import os
import sys
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.brand import Brand
from app.models.car_variant import CarVariant
from app.models.segment import Segment
from app.models.vehicle_model import VehicleModel


# Top 100 Listesini temsil eden basit bir veri yapısı
# (Gerçek dünyada bu liste yüzlerce varyant içerebilir, burada popüler modelleri gruplayarak ekliyoruz)
POPULAR_CARS = [
    # FIAT
    {"brand": "Fiat", "country": "Italy", "segment": "C-Sedan", "model": "Egea", "body_type": "Sedan", "variants": [
        {"trim": "1.4 Fire Easy", "year": 2021, "fuel": "Benzin", "gear": "Manuel", "hp": 95},
        {"trim": "1.3 Multijet Urban", "year": 2021, "fuel": "Dizel", "gear": "Manuel", "hp": 95},
        {"trim": "1.6 Multijet Lounge", "year": 2022, "fuel": "Dizel", "gear": "Otomatik", "hp": 130},
    ]},
    # RENAULT
    {"brand": "Renault", "country": "France", "segment": "B-Hatchback", "model": "Clio", "body_type": "Hatchback", "variants": [
        {"trim": "1.0 TCe Joy", "year": 2022, "fuel": "Benzin", "gear": "Otomatik", "hp": 90},
        {"trim": "1.0 TCe Touch", "year": 2023, "fuel": "Benzin", "gear": "Otomatik", "hp": 90},
    ]},
    {"brand": "Renault", "country": "France", "segment": "C-Sedan", "model": "Megane", "body_type": "Sedan", "variants": [
        {"trim": "1.3 TCe Joy", "year": 2022, "fuel": "Benzin", "gear": "Otomatik", "hp": 140},
        {"trim": "1.5 Blue dCi Touch", "year": 2021, "fuel": "Dizel", "gear": "Otomatik", "hp": 115},
    ]},
    # TOYOTA
    {"brand": "Toyota", "country": "Japan", "segment": "C-Sedan", "model": "Corolla", "body_type": "Sedan", "variants": [
        {"trim": "1.5 Vision", "year": 2022, "fuel": "Benzin", "gear": "Otomatik", "hp": 123},
        {"trim": "1.8 Hybrid Dream", "year": 2023, "fuel": "Hibrit", "gear": "Otomatik", "hp": 122},
    ]},
    # VOLKSWAGEN
    {"brand": "Volkswagen", "country": "Germany", "segment": "C-Sedan", "model": "Passat", "body_type": "Sedan", "variants": [
        {"trim": "1.5 TSI Impression", "year": 2021, "fuel": "Benzin", "gear": "Otomatik", "hp": 150},
        {"trim": "1.6 TDI Business", "year": 2020, "fuel": "Dizel", "gear": "Otomatik", "hp": 120},
    ]},
    {"brand": "Volkswagen", "country": "Germany", "segment": "C-Hatchback", "model": "Golf", "body_type": "Hatchback", "variants": [
        {"trim": "1.0 eTSI Life", "year": 2022, "fuel": "Hibrit", "gear": "Otomatik", "hp": 110},
    ]},
    # FORD
    {"brand": "Ford", "country": "USA", "segment": "C-Sedan", "model": "Focus", "body_type": "Sedan", "variants": [
        {"trim": "1.5 Ti-VCT Trend X", "year": 2021, "fuel": "Benzin", "gear": "Otomatik", "hp": 123},
    ]},
    # HYUNDAI
    {"brand": "Hyundai", "country": "South Korea", "segment": "B-Hatchback", "model": "i20", "body_type": "Hatchback", "variants": [
        {"trim": "1.4 MPI Jump", "year": 2023, "fuel": "Benzin", "gear": "Otomatik", "hp": 100},
    ]},
    {"brand": "Hyundai", "country": "South Korea", "segment": "C-SUV", "model": "Tucson", "body_type": "SUV", "variants": [
        {"trim": "1.6 T-GDI Prime Plus", "year": 2022, "fuel": "Benzin", "gear": "Otomatik", "hp": 180},
    ]},
    # DACIA
    {"brand": "Dacia", "country": "Romania", "segment": "B-SUV", "model": "Duster", "body_type": "SUV", "variants": [
        {"trim": "1.3 TCe Journey", "year": 2023, "fuel": "Benzin", "gear": "Otomatik", "hp": 150},
        {"trim": "1.5 Blue dCi Essential", "year": 2021, "fuel": "Dizel", "gear": "Manuel", "hp": 115},
    ]},
    # PEUGEOT
    {"brand": "Peugeot", "country": "France", "segment": "B-SUV", "model": "2008", "body_type": "SUV", "variants": [
        {"trim": "1.2 PureTech Allure", "year": 2022, "fuel": "Benzin", "gear": "Otomatik", "hp": 130},
    ]},
    {"brand": "Peugeot", "country": "France", "segment": "C-SUV", "model": "3008", "body_type": "SUV", "variants": [
        {"trim": "1.5 BlueHDi Allure", "year": 2021, "fuel": "Dizel", "gear": "Otomatik", "hp": 130},
    ]},
    # OPEL
    {"brand": "Opel", "country": "Germany", "segment": "B-Hatchback", "model": "Corsa", "body_type": "Hatchback", "variants": [
        {"trim": "1.2 Turbo Edition", "year": 2023, "fuel": "Benzin", "gear": "Otomatik", "hp": 100},
    ]},
    {"brand": "Opel", "country": "Germany", "segment": "B-SUV", "model": "Mokka", "body_type": "SUV", "variants": [
        {"trim": "1.2 Turbo Elegance", "year": 2022, "fuel": "Benzin", "gear": "Otomatik", "hp": 130},
    ]},
    # HONDA
    {"brand": "Honda", "country": "Japan", "segment": "C-Sedan", "model": "Civic", "body_type": "Sedan", "variants": [
        {"trim": "1.5 VTEC Turbo Eco Elegance", "year": 2022, "fuel": "LPG", "gear": "Otomatik", "hp": 129},
    ]},
    # SKODA
    {"brand": "Skoda", "country": "Czech Republic", "segment": "C-Sedan", "model": "Octavia", "body_type": "Sedan", "variants": [
        {"trim": "1.0 TSI e-Tec Elite", "year": 2022, "fuel": "Hibrit", "gear": "Otomatik", "hp": 110},
    ]},
    {"brand": "Skoda", "country": "Czech Republic", "segment": "C-SUV", "model": "Karoq", "body_type": "SUV", "variants": [
        {"trim": "1.5 TSI Premium", "year": 2023, "fuel": "Benzin", "gear": "Otomatik", "hp": 150},
    ]},
    # MERCEDES-BENZ
    {"brand": "Mercedes-Benz", "country": "Germany", "segment": "Premium C-Sedan", "model": "A 180", "body_type": "Sedan", "variants": [
        {"trim": "AMG", "year": 2014, "fuel": "Benzin", "gear": "Otomatik", "hp": 122},
        {"trim": "AMG", "year": 2020, "fuel": "Benzin", "gear": "Otomatik", "hp": 136},
    ]},
    {"brand": "Mercedes-Benz", "country": "Germany", "segment": "Premium D-Sedan", "model": "C 200", "body_type": "Sedan", "variants": [
        {"trim": "AMG", "year": 2021, "fuel": "Benzin", "gear": "Otomatik", "hp": 204},
    ]},
]


def seed_top_cars() -> None:
    db = SessionLocal()
    try:
        added_variants = 0
        
        for car_data in POPULAR_CARS:
            # 1. Brand
            brand = db.scalars(select(Brand).where(Brand.name == car_data["brand"])).first()
            if not brand:
                brand = Brand(name=car_data["brand"], country=car_data["country"], is_active=True)
                db.add(brand)
                db.flush()

            # 2. Segment
            segment = db.scalars(select(Segment).where(Segment.name == car_data["segment"])).first()
            if not segment:
                segment = Segment(name=car_data["segment"], category_type="technical", description=car_data["segment"])
                db.add(segment)
                db.flush()

            # 3. Model
            model = db.scalars(select(VehicleModel).where(
                VehicleModel.brand_id == brand.id,
                VehicleModel.name == car_data["model"]
            )).first()
            if not model:
                model = VehicleModel(
                    brand_id=brand.id,
                    segment_id=segment.id,
                    name=car_data["model"],
                    body_type=car_data["body_type"],
                    start_year=2010, # default varsayım
                )
                db.add(model)
                db.flush()

            # 4. Variants
            for v in car_data["variants"]:
                # Varyant zaten var mı kontrol et
                existing_variant = db.scalars(select(CarVariant).where(
                    CarVariant.model_id == model.id,
                    CarVariant.trim_name == v["trim"],
                    CarVariant.year == v["year"]
                )).first()

                if not existing_variant:
                    new_variant = CarVariant(
                        model_id=model.id,
                        trim_name=v["trim"],
                        year=v["year"],
                        fuel_type=v["fuel"],
                        transmission=v["gear"],
                        horsepower=v["hp"],
                        # Diğer özellikleri varsayılan veya None bırakıyoruz. Sahibinden bunları okumuyor.
                    )
                    db.add(new_variant)
                    added_variants += 1

        db.commit()
        print(f"Başarıyla tamamlandı! Veritabanına {added_variants} yeni araç varyantı eklendi.")
        print("Artık cron scriptini çalıştırarak bu araçların Sahibinden fiyatlarını çekebilirsin:")
        print("  python scripts/update_prices_cron.py")

    except Exception as e:
        db.rollback()
        print(f"Hata oluştu: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_top_cars()
