"""
sahibinden_service.py
─────────────────────────────────────────────────────────────
Sahibinden.com ilan scraper servisi.

Yöntem: Playwright (headless Chromium) + BeautifulSoup HTML parser.
Playwright gerçek bir browser çalıştırdığından Cloudflare JS
challenge'larını geçebilir.

Kullanım:
    from app.services.sahibinden_service import search_sahibinden
    result = await search_sahibinden(req)
"""

from __future__ import annotations

import asyncio
import re
import statistics
from typing import Optional
from urllib.parse import urlencode

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

from app.schemas.sahibinden import (
    SahibindenListing,
    SahibindenMarketStats,
    SahibindenSearchRequest,
    SahibindenSearchResponse,
)

BASE_URL = "https://www.sahibinden.com"
PAGE_SIZE = 50

# Yakıt tipi normalizasyon tablosu
_FUEL_MAP: dict[str, str] = {
    "benzin": "Benzin",
    "dizel": "Dizel",
    "lpg": "LPG",
    "lpg & benzin": "LPG",
    "elektrik": "Elektrik",
    "hibrit": "Hibrit",
    "hybrid": "Hibrit",
}

# Şehir adı normalizasyonu
_CITY_CORRECTIONS: dict[str, str] = {
    "i̇stanbul": "İstanbul",
    "i̇zmir": "İzmir",
    "ankara": "Ankara",
}


# ─── Yardımcı parse fonksiyonları ───────────────────────────────────
def _parse_price(text: str) -> Optional[int]:
    cleaned = re.sub(r"[^\d]", "", text)
    if cleaned:
        val = int(cleaned)
        return val if val > 0 else None
    return None


def _parse_km(text: str) -> Optional[int]:
    cleaned = re.sub(r"[^\d]", "", text)
    return int(cleaned) if cleaned else None


def _parse_year(text: str) -> Optional[int]:
    m = re.search(r"\b(19|20)\d{2}\b", text)
    return int(m.group()) if m else None


def _normalize_city(raw: str) -> str:
    low = raw.strip().lower()
    return _CITY_CORRECTIONS.get(low, raw.strip().title())


# ─── HTML parser ─────────────────────────────────────────────────────
def _parse_listings_page(html: str) -> list[SahibindenListing]:
    """
    Sahibinden.com arama sonuç sayfasını parse et.

    Tablo yapısı:
        <table class="searchResultsTable">
          <tr class="searchResultsItem ...">
            <td class="searchResultsTitleValue">
            <td class="searchResultsAttributeValue">  (×2: yıl, km)
            <td class="searchResultsPriceValue">
            <td class="searchResultsDateValue">       (tarih + şehir)
    """
    soup = BeautifulSoup(html, "lxml")
    results: list[SahibindenListing] = []

    table = soup.find("table", class_="searchResultsTable")
    if not table:
        return results

    rows = table.find_all("tr", class_=re.compile(r"searchResultsItem"))
    for row in rows:
        try:
            listing = _parse_row(row)
            if listing:
                results.append(listing)
        except Exception:
            continue

    return results


def _parse_row(row) -> Optional[SahibindenListing]:
    # ── İlan ID ──
    ad_id = row.get("data-id") or row.get("id", "").replace("listing-", "") or None

    # ── Başlık & URL ──
    title_td = row.find("td", class_="searchResultsTitleValue")
    if not title_td:
        return None
    a_tag = title_td.find("a", class_="classifiedTitle")
    if not a_tag:
        return None
    title = a_tag.get_text(strip=True)
    href = a_tag.get("href", "")
    url = (BASE_URL + href) if href.startswith("/") else href or None

    # ── Fiyat ──
    price_td = row.find("td", class_="searchResultsPriceValue")
    if not price_td:
        return None
    price_span = price_td.find("span", class_="classified-price-value") or price_td
    price = _parse_price(price_span.get_text(strip=True))
    if not price:
        return None

    # ── Özellikler (yıl, km) ──
    attr_tds = row.find_all("td", class_="searchResultsAttributeValue")
    year: Optional[int] = None
    km: Optional[int] = None
    if len(attr_tds) >= 2:
        year = _parse_year(attr_tds[0].get_text(strip=True))
        km = _parse_km(attr_tds[1].get_text(strip=True))
    elif len(attr_tds) == 1:
        year = _parse_year(attr_tds[0].get_text(strip=True))

    # ── Şehir / tarih ──
    date_td = row.find("td", class_="searchResultsDateValue")
    city: Optional[str] = None
    district: Optional[str] = None
    listed_at: Optional[str] = None
    if date_td:
        spans = date_td.find_all("span")
        if len(spans) >= 2:
            listed_at = spans[0].get_text(strip=True)
            loc_raw = spans[1].get_text(strip=True)
            parts = [p.strip() for p in loc_raw.split("/")]
            city = _normalize_city(parts[0]) if parts else None
            district = parts[1] if len(parts) > 1 else None
        elif len(spans) == 1:
            city = _normalize_city(spans[0].get_text(strip=True))

    # ── Satıcı tipi ──
    seller_type: Optional[str] = None
    store_td = row.find("td", class_="searchResultsUserNameValue")
    if store_td:
        galeri_el = store_td.find(class_=re.compile(r"store|gallery|galeri", re.I))
        seller_type = "galeri" if galeri_el else "sahibinden"

    return SahibindenListing(
        ad_id=ad_id,
        title=title,
        price=price,
        year=year,
        km=km,
        city=city,
        district=district,
        seller_type=seller_type,
        listed_at=listed_at,
        url=url,
    )


# ─── URL builder ────────────────────────────────────────────────────
_SORT_MAP = {
    "date_desc":  "date_desc",
    "price_asc":  "price_asc",
    "price_desc": "price_desc",
    "km_asc":     "km_asc",
}

_FUEL_SLUG_MAP = {
    "benzin":   "1",
    "dizel":    "3",
    "lpg":      "2",
    "elektrik": "5",
    "hibrit":   "7",
}

_TRANS_SLUG_MAP = {
    "manuel":   "1",
    "otomatik": "2",
}


def _build_url(req: SahibindenSearchRequest, page: int) -> str:
    params: dict[str, str] = {
        "pagingSize": str(PAGE_SIZE),
        "pagingOffset": str(page * PAGE_SIZE),
        "sorting": _SORT_MAP.get(req.sort, "date_desc"),
    }
    if req.year_min:
        params["year_min"] = str(req.year_min)
    if req.year_max:
        params["year_max"] = str(req.year_max)
    if req.price_min:
        params["price_min"] = str(req.price_min)
    if req.price_max:
        params["price_max"] = str(req.price_max)
    if req.km_max:
        params["km_max_km"] = str(req.km_max)

    fuel_key = (req.fuel_type or "").lower()
    if fuel_key in _FUEL_SLUG_MAP:
        params["fuel_type"] = _FUEL_SLUG_MAP[fuel_key]

    trans_key = (req.transmission or "").lower()
    if trans_key in _TRANS_SLUG_MAP:
        params["gear"] = _TRANS_SLUG_MAP[trans_key]

    slug = req.category_slug.strip("/")
    return f"{BASE_URL}/{slug}?{urlencode(params)}"


# ─── Ana servis fonksiyonu ───────────────────────────────────────────
async def search_sahibinden(req: SahibindenSearchRequest) -> SahibindenSearchResponse:
    """
    Sahibinden.com'dan ilan çek, piyasa istatistiklerini hesapla.
    Playwright headless Chromium ile Cloudflare JS challenge'larını geçer.
    """
    all_listings: list[SahibindenListing] = []
    pages_fetched = 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        context = await browser.new_context(
            locale="tr-TR",
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1440, "height": 900},
            extra_http_headers={
                "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8",
            },
        )

        # navigator.webdriver gizle
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        page = await context.new_page()

        try:
            for page_num in range(req.max_pages):
                url = _build_url(req, page_num)
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                    # Cloudflare geçiş sayfası için bekle
                    await asyncio.sleep(2)
                    # searchResultsTable yüklenene kadar bekle (max 10s)
                    try:
                        await page.wait_for_selector(
                            "table.searchResultsTable", timeout=10000
                        )
                    except PlaywrightTimeout:
                        # Tablo yok → blok ya da boş sonuç
                        break
                except PlaywrightTimeout:
                    break

                html = await page.content()
                page_listings = _parse_listings_page(html)

                if not page_listings:
                    break

                if req.city:
                    city_lower = req.city.lower()
                    page_listings = [
                        l for l in page_listings
                        if l.city and city_lower in l.city.lower()
                    ]

                all_listings.extend(page_listings)
                pages_fetched += 1

                if len(page_listings) < PAGE_SIZE:
                    break

                if page_num < req.max_pages - 1:
                    await asyncio.sleep(1.0)

        finally:
            await browser.close()

    stats = _compute_stats(all_listings)
    return SahibindenSearchResponse(
        query=req,
        stats=stats,
        listings=all_listings,
        pages_fetched=pages_fetched,
    )


def _compute_stats(listings: list[SahibindenListing]) -> SahibindenMarketStats:
    prices = [l.price for l in listings if l.price and l.price > 0]
    if not prices:
        return SahibindenMarketStats(total_listings=len(listings))

    sorted_prices = sorted(prices)
    n = len(prices)

    def percentile(data: list[int], pct: float) -> float:
        k = (len(data) - 1) * pct
        f, c = int(k), int(k) + 1
        if c >= len(data):
            return float(data[-1])
        return data[f] + (data[c] - data[f]) * (k - f)

    return SahibindenMarketStats(
        total_listings=len(listings),
        avg_price=round(statistics.mean(prices), 2),
        median_price=round(statistics.median(prices), 2),
        min_price=sorted_prices[0],
        max_price=sorted_prices[-1],
        std_dev=round(statistics.stdev(prices), 2) if n >= 2 else None,
        price_25th=round(percentile(sorted_prices, 0.25), 2),
        price_75th=round(percentile(sorted_prices, 0.75), 2),
    )
