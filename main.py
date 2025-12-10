import os
import time
import json
import traceback
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import requests
from bs4 import BeautifulSoup

# ============================================================
# 🔥 HOOPBRAIN PROXY — FAZ-23 + FAZ-13 UYUMLU ÇEKİRDEK
# ============================================================

app = FastAPI(
    title="HoopBrain Proxy",
    version="23.0",
    description="FAZ-23 + FAZ-13 için istatistik, barem, haber, live veri proxy çekirdek servisi."
)

# ------------------------------------------------------------
# GLOBAL RATE-LIMIT (60 req / 60 sec)
# ------------------------------------------------------------
REQ_LIMIT = 60
WINDOW = 60
req_times = []

def allow_request():
    now = time.time()
    req_times.append(now)
    while req_times and req_times[0] < now - WINDOW:
        req_times.pop(0)
    return len(req_times) <= REQ_LIMIT


# ------------------------------------------------------------
# GENEL REQUEST FONKSİYONU (timeout + fail-safe)
# ------------------------------------------------------------
def fetch_url(url: str):
    try:
        if not allow_request():
            return {"error": "Rate limit exceeded"}

        r = requests.get(url, timeout=7, headers={
            "User-Agent": "Mozilla/5.0 (HoopBrain Proxy)"
        })
        r.raise_for_status()
        return r.text
    except Exception as e:
        return {"error": str(e)}


# ------------------------------------------------------------
# ✔ 1) LIVE PROVIDERS (FAZ-23 çekirdek uyumlu)
# ------------------------------------------------------------
@app.get("/live")
def get_live(match_id: str = Query(...)):
    try:
        url = f"https://www.flashscore.com/match/{match_id}/#/match-summary"
        html = fetch_url(url)
        if isinstance(html, dict):
            return html

        soup = BeautifulSoup(html, "lxml")

        score = soup.select_one(".detailScore__wrapper")
        home = soup.select_one(".participant__home .participant__participantName")
        away = soup.select_one(".participant__away .participant__participantName")

        return {
            "match_id": match_id,
            "home": home.text.strip() if home else None,
            "away": away.text.strip() if away else None,
            "score": score.text.strip() if score else None
        }

    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


# ------------------------------------------------------------
# ✔ 2) İSTATİSTİK / TAKIM FORM / H2H (FAZ-13 uyumlu)
# ------------------------------------------------------------
@app.get("/stats")
def get_stats(match_id: str = Query(...)):
    try:
        url = f"https://www.flashscore.com/match/{match_id}/#/h2h/overall"
        html = fetch_url(url)
        if isinstance(html, dict):
            return html

        soup = BeautifulSoup(html, "lxml")

        blocks = soup.select(".h2h__section")
        data = []

        for b in blocks:
            title = b.select_one(".section__title")
            table = b.select("tr")
            rows = []
            for row in table:
                cols = [c.text.strip() for c in row.select("td")]
                if cols:
                    rows.append(cols)

            data.append({
                "title": title.text.strip() if title else None,
                "rows": rows
            })

        return {"match_id": match_id, "data": data}

    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


# ------------------------------------------------------------
# ✔ 3) BAREM / MAÇ ÖNCESİ LİNE (iddaa – nesine – odds API)
# ------------------------------------------------------------
@app.get("/barem")
def get_barems(match_id: str = Query(...)):
    try:
        url = f"https://www.mackolik.com/basketbol/mac-detay/{match_id}"
        html = fetch_url(url)
        if isinstance(html, dict):
            return html

        soup = BeautifulSoup(html, "lxml")

        odds = soup.select(".odds-item")
        lines = []

        for o in odds:
            t = o.text.strip().replace("\n", " ")
            if t:
                lines.append(t)

        return {"match_id": match_id, "baremler": lines}

    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


# ------------------------------------------------------------
# ✔ 4) HABER / SON DAKİKA / KADRO BİLGİSİ (FIBA – NBA – EuroLeague)
# ------------------------------------------------------------
@app.get("/news")
def get_news(team: str = Query(...)):
    try:
        url = f"https://news.google.com/search?q={team}+basketball&hl=tr&gl=TR&ceid=TR:tr"
        html = fetch_url(url)
        if isinstance(html, dict):
            return html

        soup = BeautifulSoup(html, "lxml")

        titles = [x.text for x in soup.select("h3")]

        return {
            "team": team,
            "count": len(titles),
            "headlines": titles[:15]
        }

    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc()}


# ------------------------------------------------------------
# ✔ 5) HEALTHCHECK
# ------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "uptime": time.time()}


# ------------------------------------------------------------
# MAIN (Fly.io uvicorn runner)
# ------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080)),
        workers=1
    )
