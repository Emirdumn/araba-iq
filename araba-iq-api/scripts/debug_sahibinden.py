#!/usr/bin/env python3
"""Debug: Check what Sahibinden returns for headless browser."""
import asyncio, re, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from urllib.parse import quote
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def main():
    term = "Fiat Egea"
    q = quote(term)
    url = f"https://www.sahibinden.com/otomobil?pagingSize=50&sorting=date_desc&query_text={q}&a5_min=2023&a5_max=2023"
    print("URL:", url)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        page = await ctx.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(5000)
        title = await page.title()
        html = await page.content()
        await browser.close()

    print("Title:", title)
    print("HTML length:", len(html))

    soup = BeautifulSoup(html, "lxml")

    sel1 = soup.select("td.searchResultsPriceValue span")
    print(f"\ntd.searchResultsPriceValue span: {len(sel1)}")

    sel2 = soup.select(".searchResultsPriceValue")
    print(f".searchResultsPriceValue: {len(sel2)}")

    sel3 = soup.select("[class*='price']")
    print(f"[class*='price']: {len(sel3)}")
    for s in sel3[:3]:
        print(f"  class={s.get('class')} text={s.get_text(strip=True)[:80]}")

    nums = re.findall(r"\d{2,3}\.\d{3}", html)
    print(f"\nPrice-like numbers (XX.XXX): {nums[:15]}")

    if "captcha" in html.lower() or "challenge" in html.lower():
        print("\n*** CAPTCHA/CHALLENGE detected! ***")
    if "searchResults" in html:
        print("\n*** searchResults class found in HTML ***")
    else:
        print("\n*** searchResults NOT found — likely blocked ***")

asyncio.run(main())
