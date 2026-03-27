"""
sahibinden.py — Sahibinden.com scraper route

POST /api/v1/sahibinden/search
    → İlan listesi + piyasa istatistikleri döner.

GET  /api/v1/sahibinden/search
    → Hızlı sorgu için query-param versiyonu.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.sahibinden import (
    SahibindenSearchRequest,
    SahibindenSearchResponse,
)
from app.services.sahibinden_service import search_sahibinden

router = APIRouter(prefix="/sahibinden", tags=["sahibinden"])


@router.post("/search", response_model=SahibindenSearchResponse, summary="Sahibinden.com ilan ara")
async def sahibinden_search_post(req: SahibindenSearchRequest) -> SahibindenSearchResponse:
    """
    Sahibinden.com'dan ilan çek ve piyasa istatistiklerini hesapla.

    **`category_slug`** örnekleri:
    - `"otomobil"` → tüm araçlar
    - `"toyota-corolla"` → Toyota Corolla ilanları
    - `"bmw-3-serisi"` → BMW 3 Serisi ilanları
    - `"volkswagen-golf"` → VW Golf ilanları

    Slug'ı bulmak için sahibinden.com'da arama yapın ve URL'deki
    ilk path segmentini kullanın (örn. `/toyota-corolla?...` → `toyota-corolla`).
    """
    try:
        return await search_sahibinden(req)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Sahibinden.com'a erişilemedi: {exc}",
        ) from exc


@router.get("/search", response_model=SahibindenSearchResponse, summary="Sahibinden.com ilan ara (GET)")
async def sahibinden_search_get(
    category_slug: str = Query("otomobil", description="Sahibinden kategori slug'ı"),
    year_min: Optional[int] = Query(None),
    year_max: Optional[int] = Query(None),
    price_min: Optional[int] = Query(None),
    price_max: Optional[int] = Query(None),
    km_max: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    fuel_type: Optional[str] = Query(None),
    transmission: Optional[str] = Query(None),
    max_pages: int = Query(3, ge=1, le=10),
    sort: str = Query("date_desc"),
) -> SahibindenSearchResponse:
    req = SahibindenSearchRequest(
        category_slug=category_slug,
        year_min=year_min,
        year_max=year_max,
        price_min=price_min,
        price_max=price_max,
        km_max=km_max,
        city=city,
        fuel_type=fuel_type,
        transmission=transmission,
        max_pages=max_pages,
        sort=sort,
    )
    try:
        return await search_sahibinden(req)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Sahibinden.com'a erişilemedi: {exc}",
        ) from exc
