#!/usr/bin/env python3
"""
Weekly cron: Stealth-fetch Sahibinden prices for all car_variants,
fallback to arabam.com, write PriceHistory snapshots.

Uses playwright-stealth + realistic browser behavior + cookie persistence
to bypass anti-bot detection.

Usage:
  xvfb-run python scripts/update_prices_cron.py        # non-headless (best stealth)
  PYTHONPATH=. python scripts/update_prices_cron.py     # headless fallback

Crontab (every Sunday 03:00):
  0 3 * * 0 cd /home/ubuntu/araba-iq && docker compose exec -T araba-iq-api xvfb-run python scripts/update_prices_cron.py >> /var/log/araba_iq_cron.log 2>&1
"""

import asyncio
import json
import os
import random
import re
import statistics
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import normalize_database_url

engine = create_engine(normalize_database_url(settings.database_url))

COOKIE_FILE = Path("/tmp/sahibinden_cookies.json")
USE_XVFB = os.environ.get("DISPLAY") is not None or os.path.exists("/usr/bin/xvfb-run")

REAL_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


def _save_cookies(cookies: list[dict]):
    COOKIE_FILE.write_text(json.dumps(cookies, ensure_ascii=False))


def _load_cookies() -> list[dict] | None:
    if COOKIE_FILE.exists():
        try:
            return json.loads(COOKIE_FILE.read_text())
        except Exception:
            pass
    return None


async def _human_delay(lo=1500, hi=4000):
    await asyncio.sleep(random.randint(lo, hi) / 1000)


async def _human_scroll(page):
    for _ in range(random.randint(1, 3)):
        delta = random.randint(200, 500)
        await page.evaluate(f"window.scrollBy(0, {delta})")
        await _human_delay(300, 800)


async def _human_mouse(page):
    x = random.randint(100, 800)
    y = random.randint(100, 500)
    await page.mouse.move(x, y)
    await _human_delay(200, 600)


async def create_stealth_browser():
    from playwright_stealth import Stealth
    from playwright.async_api import async_playwright

    stealth = Stealth()
    pw = await stealth.use_async(async_playwright()).start()

    browser = await pw.chromium.launch(
        headless=False,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-blink-features=AutomationControlled",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-infobars",
            "--window-size=1366,768",
        ],
    )

    ctx = await browser.new_context(
        locale="tr-TR",
        timezone_id="Europe/Istanbul",
        viewport={"width": 1366, "height": 768},
        screen={"width": 1366, "height": 768},
        color_scheme="light",
        user_agent=REAL_UA,
        extra_http_headers={
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        },
    )

    saved = _load_cookies()
    if saved:
        await ctx.add_cookies(saved)
        print("  [stealth] Loaded saved cookies")

    return pw, browser, ctx


async def fetch_sahibinden_prices(brand: str, model: str, year: int) -> dict | None:
    from urllib.parse import quote
    from bs4 import BeautifulSoup

    search_term = f"{brand} {model}"
    url = (
        f"https://www.sahibinden.com/otomobil?"
        f"pagingSize=50&sorting=date_desc"
        f"&query_text={quote(search_term)}"
        f"&a5_min={year}&a5_max={year}"
    )

    prices = []
    pw = browser = ctx = None
    try:
        pw, browser, ctx = await create_stealth_browser()
        page = await ctx.new_page()

        await page.goto("https://www.sahibinden.com", wait_until="domcontentloaded", timeout=25000)
        await _human_delay(2000, 4000)
        await _human_mouse(page)
        await _human_scroll(page)
        await _human_delay(1000, 2000)

        await page.goto(url, wait_until="domcontentloaded", timeout=25000)
        await _human_delay(2500, 5000)
        await _human_mouse(page)
        await _human_scroll(page)

        try:
            await page.wait_for_selector("table.searchResultsTable", timeout=12000)
        except Exception:
            html_check = await page.content()
            if "captcha" in html_check.lower() or "login" in (await page.title()).lower():
                print("    [sahibinden] CAPTCHA/login detected, skipping")
                return None

        html = await page.content()

        cookies = await ctx.cookies()
        _save_cookies(cookies)

        soup = BeautifulSoup(html, "lxml")

        for td in soup.select("td.searchResultsPriceValue"):
            span = td.find("span")
            if not span:
                continue
            txt = re.sub(r"[^\d]", "", span.get_text(strip=True))
            try:
                val = int(txt)
                if 10_000 < val < 50_000_000:
                    prices.append(val)
            except ValueError:
                continue

    except Exception as e:
        print(f"    [sahibinden] Error: {e}")
        return None
    finally:
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

    if not prices:
        return None
    return {"prices": prices, "count": len(prices), "source": "sahibinden"}


async def fetch_arabam_prices(brand: str, model: str, year: int) -> dict | None:
    """Fallback: arabam.com (simpler protection)."""
    from urllib.parse import quote
    from bs4 import BeautifulSoup
    from playwright_stealth import Stealth
    from playwright.async_api import async_playwright

    search_url = (
        f"https://www.arabam.com/ikinci-el?"
        f"query={quote(f'{brand} {model}')}"
        f"&minYear={year}&maxYear={year}"
        f"&take=50&sortBy=lastUpdate&sortDirection=Descending"
    )

    prices = []
    pw = browser = None
    try:
        stealth = Stealth()
        pw = await stealth.use_async(async_playwright()).start()
        browser = await pw.chromium.launch(
            headless=False,
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
        await _human_delay(2000, 4000)
        await _human_scroll(page)

        html = await page.content()
        soup = BeautifulSoup(html, "lxml")

        for el in soup.select("[class*='listing-price'], [class*='price-value'], .listing-price-new span"):
            txt = re.sub(r"[^\d]", "", el.get_text(strip=True))
            try:
                val = int(txt)
                if 10_000 < val < 50_000_000:
                    prices.append(val)
            except ValueError:
                continue

        if not prices:
            for el in soup.find_all(string=re.compile(r"\d{2,3}\.\d{3}\s*TL")):
                txt = re.sub(r"[^\d]", "", el.strip())
                try:
                    val = int(txt)
                    if 10_000 < val < 50_000_000:
                        prices.append(val)
                except ValueError:
                    continue

    except Exception as e:
        print(f"    [arabam] Error: {e}")
        return None
    finally:
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

    if not prices:
        return None
    return {"prices": prices, "count": len(prices), "source": "arabam"}


async def process_variant(vid: int, brand: str, model: str, trim: str, year: int) -> dict | None:
    label = f"{brand} {model} {trim} ({year})"
    print(f"  Searching: {label}...")

    result = await fetch_sahibinden_prices(brand, model, year)

    if not result:
        print(f"    Sahibinden failed, trying arabam.com...")
        result = await fetch_arabam_prices(brand, model, year)

    if not result or result["count"] == 0:
        print(f"    No listings found for {label}")
        return None

    prices = result["prices"]
    source = result["source"]
    avg = int(statistics.mean(prices))
    med = int(statistics.median(prices))
    mn, mx = min(prices), max(prices)
    cnt = result["count"]

    print(f"    [{source}] Found {cnt} listings: avg={avg:,} min={mn:,} max={mx:,}")

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
    print(f"=== ArabaIQ Stealth Price Update — {date.today()} ===")

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT cv.id, b.name AS brand, m.name AS model, cv.trim_name, cv.year
            FROM car_variants cv
            JOIN models m ON cv.model_id = m.id
            JOIN brands b ON m.brand_id = b.id
            ORDER BY b.name, m.name, cv.year
        """)).fetchall()

    print(f"Total variants: {len(rows)}")

    success, fail = 0, 0
    for i, row in enumerate(rows):
        vid, brand, model, trim, year = row
        result = await process_variant(vid, brand, model, trim, year)
        if result:
            success += 1
        else:
            fail += 1

        delay = random.uniform(3.0, 6.0)
        print(f"  [{i+1}/{len(rows)}] Waiting {delay:.1f}s...")
        await asyncio.sleep(delay)

    print(f"\n=== Done: {success} updated, {fail} skipped ===")


if __name__ == "__main__":
    asyncio.run(main())
