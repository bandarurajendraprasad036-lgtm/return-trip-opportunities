"""Home bell image check: 3 browser engines x phone sizes (portrait + landscape).
Run: python3 scripts/check-bell-layout.py  (dev server on :8080). Exits 1 on any failure.
Checks: image loads, sits fully inside the bell, same size/position everywhere,
no sideways scroll, meaningful alt text, and fallback when today's image fails."""
import asyncio, sys
from playwright.async_api import async_playwright
URL = "http://localhost:8080/"
SIZES = [(320, 568), (360, 740), (412, 915), (568, 320), (740, 360), (915, 412)]
EXPECT = 128  # px image size on the bell
ALT = "గాయత్రి మాత · Gayatri Mata"
JS = """e=>{const i=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();
return {w:Math.round(i.width),h:Math.round(i.height),dx:Math.round((i.left+i.right)/2-(p.left+p.right)/2),
dy:Math.round(i.top-p.top),inside:i.left>=p.left&&i.right<=p.right&&i.top>=p.top&&i.bottom<=p.bottom,
loaded:e.complete&&e.naturalWidth>0,visible:getComputedStyle(e).visibility!=='hidden',alt:e.alt,
sw:document.documentElement.scrollWidth,vw:innerWidth}}"""
fails = []
async def check(page, label, ref):
    r = await page.locator(f'img[alt="{ALT}"]').evaluate(JS)
    bad = [k for k, ok in {"loads": r["loaded"] and r["visible"], "inside bell": r["inside"],
        "size": r["w"] == EXPECT and r["h"] == EXPECT, "centered": abs(r["dx"]) <= 1,
        "no sideways scroll": r["sw"] <= r["vw"], "alt text": r["alt"] == ALT}.items() if not ok]
    if ref is not None and r["dy"] != ref: bad.append("position moved")
    print(("FAIL " if bad else "ok   ") + label, r if bad else "", bad or "")
    if bad: fails.append(label)
    return r["dy"]
async def main():
    async with async_playwright() as p:
        for name in ["chromium", "firefox", "webkit"]:
            b = await getattr(p, name).launch(headless=True); ref = None
            for w, h in SIZES:
                pg = await b.new_page(viewport={"width": w, "height": h})
                await pg.goto(URL, wait_until="networkidle"); await pg.wait_for_timeout(800)
                ref = await check(pg, f"{name} {w}x{h}", ref) if ref is None else (await check(pg, f"{name} {w}x{h}", ref), ref)[1]
                await pg.close()
            # fallback: today's image fails -> another bundled image, still with alt text
            pg = await b.new_page(viewport={"width": 360, "height": 740}); first = {}
            async def block(route):
                if not first: first["u"] = route.request.url; await route.abort()
                elif route.request.url == first["u"]: await route.abort()
                else: await route.continue_()
            await pg.route("**/gayatri-mata*", block)
            await pg.goto(URL, wait_until="networkidle"); await pg.wait_for_timeout(1500)
            await check(pg, f"{name} fallback image", None); await pg.close(); await b.close()
    print("FAILED:", fails) if fails else print("ALL PASSED")
    sys.exit(1 if fails else 0)
asyncio.run(main())
