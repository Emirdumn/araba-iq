from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class SahibindenListing(BaseModel):
    """Sahibinden.com'dan çekilen tek bir ilan."""

    ad_id: Optional[str] = None
    title: str
    price: int
    currency: str = "TL"
    year: Optional[int] = None
    km: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    seller_type: Optional[str] = None  # "galeri" | "sahibinden"
    listed_at: Optional[str] = None
    url: Optional[str] = None
    color: Optional[str] = None


class SahibindenMarketStats(BaseModel):
    """Piyasa istatistikleri — toplanan ilanların özeti."""

    total_listings: int = Field(description="Çekilen toplam ilan sayısı")
    avg_price: Optional[float] = Field(None, description="Ortalama fiyat (TL)")
    median_price: Optional[float] = Field(None, description="Medyan fiyat (TL)")
    min_price: Optional[int] = Field(None, description="En düşük fiyat (TL)")
    max_price: Optional[int] = Field(None, description="En yüksek fiyat (TL)")
    std_dev: Optional[float] = Field(None, description="Standart sapma")
    price_25th: Optional[float] = Field(None, description="25. yüzdelik fiyat")
    price_75th: Optional[float] = Field(None, description="75. yüzdelik fiyat")


class SahibindenSearchRequest(BaseModel):
    """Sahibinden arama filtresi."""

    # URL path segmenti: örn. "toyota-corolla", "honda-civic", "otomobil"
    category_slug: str = Field(
        "otomobil",
        description='Sahibinden kategori slug\'u, örn. "toyota-corolla", "bmw-3-serisi"',
    )
    year_min: Optional[int] = Field(None, ge=1900, le=2030)
    year_max: Optional[int] = Field(None, ge=1900, le=2030)
    price_min: Optional[int] = Field(None, ge=0)
    price_max: Optional[int] = Field(None, ge=0)
    km_max: Optional[int] = Field(None, ge=0, description="Maksimum kilometre")
    city: Optional[str] = Field(None, description='Şehir filtresi, örn. "İstanbul"')
    fuel_type: Optional[str] = Field(
        None, description='Yakıt tipi: "Benzin", "Dizel", "Elektrik", "Hibrit", "LPG"'
    )
    transmission: Optional[str] = Field(
        None, description='Vites: "Manuel", "Otomatik"'
    )
    max_pages: int = Field(
        3, ge=1, le=10, description="Çekilecek maksimum sayfa sayısı (1 sayfa = 50 ilan)"
    )
    sort: str = Field(
        "date_desc",
        description='Sıralama: "date_desc", "price_asc", "price_desc", "km_asc"',
    )


class SahibindenSearchResponse(BaseModel):
    """Arama sonucu — ilanlar + piyasa özeti."""

    query: SahibindenSearchRequest
    stats: SahibindenMarketStats
    listings: list[SahibindenListing]
    pages_fetched: int
    source: str = "sahibinden.com"
