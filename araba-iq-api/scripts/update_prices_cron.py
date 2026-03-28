"""
Fiyatları periyodik olarak Sahibinden.com'dan güncelleyen Cron Scripti.
Çalıştırıldığında:
1. DB'deki aktif araba varyantlarını çeker.
2. Her biri için Sahibinden üzerinden fiyat araması yapar.
3. MarketListing tablosuna yazar ve MarketStat'ı (ve PriceHistory'i) günceller.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.car_variant import CarVariant
from app.models.vehicle_model import VehicleModel
from app.models.brand import Brand
from app.models.market_listing import MarketListing
from app.services.sahibinden_service import search_sahibinden
from app.schemas.sahibinden import SahibindenSearchRequest
from app.services.market_service import upsert_market_stat


def generate_slug(brand_name: str, model_name: str) -> str:
    # Sahibinden slug formatını tahmin etmeye çalışıyoruz. Örn: "mercedes-benz-a-180"
    b = brand_name.lower().replace(" ", "-")
    m = model_name.lower().replace(" ", "-")
    return f"{b}-{m}"

async def run_price_update():
    db = SessionLocal()
    try:
        # Tüm araçları getir
        stmt = select(CarVariant).join(VehicleModel).join(Brand)
        variants = db.scalars(stmt).all()

        print(f"Toplam {len(variants)} varyant bulundu. Fiyat güncellemeleri başlıyor...")

        for variant in variants:
            # Gerekli bilgileri al
            model = variant.vehicle_model
            brand = model.brand
            
            slug = generate_slug(brand.name, model.name)
            print(f"\\nArama yapılıyor: {brand.name} {model.name} {variant.year} (Slug: {slug})", flush=True)

            req = SahibindenSearchRequest(
                category_slug=slug,
                year_min=variant.year,
                year_max=variant.year,
                fuel_type=variant.fuel_type,
                transmission=variant.transmission,
                max_pages=1, # Çok sayfaya gidip banlanmamak için limitliyoruz
            )

            try:
                # Sahibinden scraper'ı çağır
                res = await search_sahibinden(req)
                
                listings = res.listings
                if not listings:
                    print("  -> İlan bulunamadı.", flush=True)
                    continue

                print(f"  -> {len(listings)} adet ilan bulundu.", flush=True)
                
                db_listings = []
                now = datetime.now(timezone.utc)
                
                # İlanları kaydet (MarketListing tablosunu yenile)
                # Önce eski aktif ilanları pasife çekebiliriz
                db.execute(
                    MarketListing.__table__.update()
                    .where(MarketListing.car_variant_id == variant.id)
                    .values(is_active=False)
                )

                for l in listings:
                    db_l = MarketListing(
                        car_variant_id=variant.id,
                        source_name="sahibinden",
                        source_listing_id=l.ad_id,
                        title=l.title,
                        price=l.price,
                        currency="TRY",
                        model_year=l.year,
                        mileage_km=l.km,
                        city=l.city,
                        district=l.district,
                        seller_type=l.seller_type,
                        url=l.url,
                        is_active=True,
                    )
                    db.add(db_l)
                    db_listings.append(db_l)

                db.commit()

                # MarketStat ve PriceHistory'yi güncelle
                # upsert_market_stat servisi içinde PriceHistory kaydı da oluşturuluyor
                stat = upsert_market_stat(db, variant.id, db_listings)
                db.commit()

                print(f"  -> {brand.name} {model.name} {variant.year} için ortalama fiyat {stat.avg_price} TL olarak güncellendi ve geçmişe kaydedildi.", flush=True)

            except Exception as e:
                print(f"  -> Hata oluştu: {e}", flush=True)
                db.rollback()

            # Banlanmamak için her istek arası rastgele bekleme süresi (5-10 sn)
            delay = random.uniform(5, 10)
            print(f"Banlanmamak için {delay:.1f} sn bekleniyor...", flush=True)
            await asyncio.sleep(delay)

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(run_price_update())
