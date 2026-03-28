#!/usr/bin/env python3
"""
Weekly price cron: Fetch car prices from arabam.com (primary) and
sahibinden.com (secondary/fallback). Write PriceHistory snapshots.

Uses playwright-stealth for anti-detection.

Usage:
  PYTHONPATH=. python scripts/update_prices_cron.py

Crontab (every Sunday 03:00):
  0 3 * * 0 cd /home/ubuntu/araba-iq && docker compose exec -T araba-iq-api python scripts/update_prices_cron.py >> /var/log/araba_iq_cron.log 2>&1
"""

import asyncio
import os
import random
import re
import statistics
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import normalize_database_url

engine = create_engine(normalize_database_url(settings.database_url))

REAL_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


async def _human_delay(lo=1500, hi=3500):
    await asyncio.sleep(random.randint(lo, hi) / 1000)


async def fetch_arabam_prices(brand: str, model: str, year: int) -> dict | None:
    """Primary source: arabam.com — lighter anti-bot protection."""
    from urllib.parse import quote
    from playwright.async_api import async_playwright
    from playwright_stealth import Stealth
    from bs4 import BeautifulSoup

    search_url = (
        f"https://www.arabam.com/ikinci-el/otomobil?"
        f"query={quote(f'{brand} {model}')}"
        f"&minYear={year}&maxYear={year}"
        f"&take=50&sortBy=lastUpdate&sortDirection=Descending"
    )

    prices = []
    try:
        stealth = Stealth()
        async with stealth.use_async(async_playwright()) as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )
            ctx = await browser.new_context(
                locale="tr-TR",
                timezone_id="Europe/Istanbul",
                viewport={"width": 1366, "height": 768},
                user_agent=REAL_UA,
            )
            page = await ctx.new_page()

            await page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
            await _human_delay(2500, 4500)
            await page.evaluate("window.scrollBy(0, 300)")
            await _human_delay(500, 1500)

            html = await page.content()
            await browser.close()

        soup = BeautifulSoup(html, "lxml")

        for el in soup.select("[class*='price']"):
            txt = el.get_text(strip=True)
            cleaned = re.sub(r"[^\d]", "", txt)
            try:
                val = int(cleaned)
                if 10_000 < val < 50_000_000:
                    prices.append(val)
            except ValueError:
                continue

    except Exception as e:
        print(f"    [arabam] Error: {e}")
        return None

    if not prices:
        return None

    unique = list(set(prices))
    return {"prices": unique, "count": len(unique), "source": "arabam"}


async def fetch_sahibinden_prices(brand: str, model: str, year: int) -> dict | None:
    """Secondary/fallback: sahibinden.com — heavy Cloudflare protection."""
    from urllib.parse import quote
    from playwright.async_api import async_playwright
    from playwright_stealth import Stealth
    from bs4 import BeautifulSoup

    url = (
        f"https://www.sahibinden.com/otomobil?"
        f"pagingSize=50&sorting=date_desc"
        f"&query_text={quote(f'{brand} {model}')}"
        f"&a5_min={year}&a5_max={year}"
    )

    prices = []
    try:
        stealth = Stealth()
        async with stealth.use_async(async_playwright()) as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )
            ctx = await browser.new_context(
                locale="tr-TR",
                timezone_id="Europe/Istanbul",
                viewport={"width": 1366, "height": 768},
                user_agent=REAL_UA,
                extra_http_headers={"Accept-Language": "tr-TR,tr;q=0.9"},
            )
            page = await ctx.new_page()

            await page.goto("https://www.sahibinden.com", wait_until="domcontentloaded", timeout=20000)
            await _human_delay(4000, 7000)
            await page.mouse.move(random.randint(200, 600), random.randint(200, 400))
            await page.evaluate("window.scrollBy(0, 200)")
            await _human_delay(1500, 3000)

            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await _human_delay(4000, 7000)

            try:
                await page.wait_for_selector("table.searchResultsTable", timeout=12000)
            except Exception:
                await browser.close()
                return None

            html = await page.content()
            await browser.close()

        soup = BeautifulSoup(html, "lxml")
        for td in soup.select("td.searchResultsPriceValue"):
            span = td.find("span")
            if not span:
                continue
            cleaned = re.sub(r"[^\d]", "", span.get_text(strip=True))
            try:
                val = int(cleaned)
                if 10_000 < val < 50_000_000:
                    prices.append(val)
            except ValueError:
                continue

    except Exception as e:
        print(f"    [sahibinden] Error: {e}")
        return None

    if not prices:
        return None
    return {"prices": prices, "count": len(prices), "source": "sahibinden"}


async def process_variant(vid: int, brand: str, model: str, trim: str, year: int) -> dict | None:
    label = f"{brand} {model} {trim} ({year})"
    print(f"  [{vid}] {label}...")

    result = await fetch_arabam_prices(brand, model, year)

    if not result:
        print(f"    arabam.com empty, trying sahibinden...")
        result = await fetch_sahibinden_prices(brand, model, year)

    if not result or result["count"] == 0:
        print(f"    No listings found")
        return None

    prices = result["prices"]
    source = result["source"]
    avg = int(statistics.mean(prices))
    med = int(statistics.median(prices))
    mn, mx = min(prices), max(prices)
    cnt = result["count"]

    print(f"    [{source}] {cnt} prices: avg={avg:,} TL")

    today = date.today()
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT id FROM price_history WHERE car_variant_id = :v AND snapshot_date = :d"),
            {"v": vid, "d": today},
        ).fetchone()

        if existing:
            conn.execute(
                text("""UPDATE price_history SET
                    sample_size=:cnt, avg_price=:avg, min_price=:mn, max_price=:mx, median_price=:med
                    WHERE id = :id"""),
                {"cnt": cnt, "avg": avg, "mn": mn, "mx": mx, "med": med, "id": existing[0]},
            )
        else:
            conn.execute(
                text("""INSERT INTO price_history
                    (car_variant_id, snapshot_date, source, sample_size, avg_price, min_price, max_price, median_price)
                    VALUES (:v, :d, :src, :cnt, :avg, :mn, :mx, :med)"""),
                {"v": vid, "d": today, "src": source, "cnt": cnt, "avg": avg, "mn": mn, "mx": mx, "med": med},
            )

        conn.execute(
            text("""INSERT INTO market_stats (car_variant_id, sample_size, avg_price, median_price, min_price, max_price, calculated_at)
                VALUES (:v, :cnt, :avg, :med, :mn, :mx, NOW())
                ON CONFLICT (car_variant_id) DO UPDATE SET
                    sample_size=:cnt, avg_price=:avg, median_price=:med, min_price=:mn, max_price=:mx, calculated_at=NOW()"""),
            {"v": vid, "cnt": cnt, "avg": avg, "med": med, "mn": mn, "mx": mx},
        )

    return {"variant_id": vid, "avg": avg, "count": cnt, "source": source}


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

    total = len(rows)
    print(f"Total variants: {total}")

    success, fail = 0, 0
    for i, row in enumerate(rows):
        vid, brand, model, trim, year = row
        result = await process_variant(vid, brand, model, trim, year)
        if result:
            success += 1
        else:
            fail += 1

        delay = random.uniform(3.0, 6.0)
        if (i + 1) % 10 == 0:
            print(f"  Progress: {i+1}/{total} ({success} ok, {fail} skip)")
        await asyncio.sleep(delay)

    print(f"\n=== Done: {success} updated, {fail} skipped ===")


if __name__ == "__main__":
    asyncio.run(main())
