#!/usr/bin/env python3
"""
Weekly cron: Fetch current Sahibinden prices for all car_variants
and write a PriceHistory snapshot.

Usage:
  PYTHONPATH=. python scripts/update_prices_cron.py

Crontab (every Sunday 03:00):
  0 3 * * 0 cd /home/ubuntu/arabaiq && docker compose exec -T araba-iq-api python scripts/update_prices_cron.py >> /var/log/araba_iq_cron.log 2>&1
"""

import asyncio
import os
import sys
import statistics
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import normalize_database_url

engine = create_engine(normalize_database_url(settings.database_url))

SEARCH_BASE = "https://www.sahibinden.com/otomobil"


async def fetch_prices_for_variant(brand: str, model: str, year: int) -> dict | None:
    """
    Search Sahibinden for a specific car and extract listing prices.
    Returns {prices: list[int], count: int} or None on failure.
    """
    from urllib.parse import quote
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
    from bs4 import BeautifulSoup

    search_term = f"{brand} {model}"
    url = f"{SEARCH_BASE}?pagingSize=50&sorting=date_desc&query_text={quote(search_term)}"
    if year:
        url += f"&a5_min={year}&a5_max={year}"

    prices = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
            )
            page = await ctx.new_page()
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(3000)
                html = await page.content()
            except PlaywrightTimeout:
                print(f"  TIMEOUT: {search_term} {year}")
                return None
            finally:
                await browser.close()

        soup = BeautifulSoup(html, "lxml")
        for td in soup.select("td.searchResultsPriceValue span"):
            txt = td.get_text(strip=True).replace(".", "").replace(",", "").replace("TL", "").strip()
            try:
                p_val = int(txt)
                if 10_000 < p_val < 50_000_000:
                    prices.append(p_val)
            except ValueError:
                continue

    except Exception as e:
        print(f"  ERROR: {search_term} {year}: {e}")
        return None

    if not prices:
        return None
    return {"prices": prices, "count": len(prices)}


async def process_variant(variant_id: int, brand: str, model: str, trim: str, year: int) -> dict | None:
    label = f"{brand} {model} {trim} ({year})"
    print(f"  Searching: {label}...")

    result = await fetch_prices_for_variant(brand, model, year)
    if not result or result["count"] == 0:
        print(f"    No listings found for {label}")
        return None

    prices = result["prices"]
    avg = int(statistics.mean(prices))
    med = int(statistics.median(prices))
    mn = min(prices)
    mx = max(prices)
    cnt = result["count"]

    print(f"    Found {cnt} listings: avg={avg:,} min={mn:,} max={mx:,}")

    today = date.today()
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT id FROM price_history WHERE car_variant_id = :v AND snapshot_date = :d"),
            {"v": variant_id, "d": today},
        ).fetchone()

        if existing:
            conn.execute(
                text("""UPDATE price_history SET
                    sample_size = :cnt, avg_price = :avg, min_price = :mn,
                    max_price = :mx, median_price = :med
                    WHERE id = :id"""),
                {"cnt": cnt, "avg": avg, "mn": mn, "mx": mx, "med": med, "id": existing[0]},
            )
        else:
            conn.execute(
                text("""INSERT INTO price_history
                    (car_variant_id, snapshot_date, source, sample_size, avg_price, min_price, max_price, median_price)
                    VALUES (:v, :d, 'sahibinden', :cnt, :avg, :mn, :mx, :med)"""),
                {"v": variant_id, "d": today, "cnt": cnt, "avg": avg, "mn": mn, "mx": mx, "med": med},
            )

        conn.execute(
            text("""INSERT INTO market_stats (car_variant_id, sample_size, avg_price, median_price, min_price, max_price, calculated_at)
                VALUES (:v, :cnt, :avg, :med, :mn, :mx, NOW())
                ON CONFLICT (car_variant_id) DO UPDATE SET
                    sample_size = :cnt, avg_price = :avg, median_price = :med,
                    min_price = :mn, max_price = :mx, calculated_at = NOW()"""),
            {"v": variant_id, "cnt": cnt, "avg": avg, "med": med, "mn": mn, "mx": mx},
        )

    return {"variant_id": variant_id, "avg": avg, "count": cnt}


async def main():
    print(f"=== ArabaIQ Price Update — {date.today()} ===")

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT cv.id, b.name AS brand, m.name AS model, cv.trim_name, cv.year
            FROM car_variants cv
            JOIN models m ON cv.model_id = m.id
            JOIN brands b ON m.brand_id = b.id
            ORDER BY b.name, m.name, cv.year
        """)).fetchall()

    print(f"Total variants to check: {len(rows)}")

    success = 0
    fail = 0
    for row in rows:
        vid, brand, model, trim, year = row
        result = await process_variant(vid, brand, model, trim, year)
        if result:
            success += 1
        else:
            fail += 1
        await asyncio.sleep(2)

    print(f"\n=== Done: {success} updated, {fail} skipped/failed ===")


if __name__ == "__main__":
    asyncio.run(main())
