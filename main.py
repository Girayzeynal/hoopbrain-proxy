import os
import logging
from typing import Dict, Any, List, Optional

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ================================================================
# 🔧 LOGGING
# ================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("hoopbrain-proxy")

# ================================================================
# ⚙️ CONFIG
# ================================================================
USER_AGENT = os.getenv(
    "PROXY_UA",
    "HoopbrainProxy/1.0 (+https://hoopbrain-proxy.fly.dev)",
)

TIMEOUT = float(os.getenv("PROXY_TIMEOUT", "8.0"))

# Buraya gerçekten kullanmak istediğin kaynakları ekleyeceğiz.
# Şu an için iskelet:
ALLOWED_SOURCES = {
    "flashscore": {
        "kind": "html",
        "base": "https://www.flashscore.com",
    },
    "mackolik": {
        "kind": "html",
        "base": "https://arsiv.mackolik.com",
    },
    "basketboltahmin": {
        "kind": "html",
        "base": "https://www.basketboltahmin.net",
    },
    "nba": {
        "kind": "html",
        "base": "https://www.nba.com",
    },
    # ileride Euroleague, resmi lig siteleri vs. eklenebilir
}

session = requests.Session()
session.headers.update({"User-Agent": USER_AGENT})

app = FastAPI(title="Hoopbrain Proxy", version="1.0.0")

# ================================================================
# 🧾 MODELLER
# ================================================================
class RawFetchRequest(BaseModel):
    source: str            # "flashscore", "mackolik", ...
    path: str              # base URL'in devamı, örn: "/basketball/match/..."
    params: Dict[str, Any] = {}
    method: str = "GET"


class PrematchMetaRequest(BaseModel):
    league: str
    date: str              # 2025-12-09
    home_team: str
    away_team: str


class PrematchMetaResponse(BaseModel):
    league: str
    date: str
    home_team: str
    away_team: str
    sources: Dict[str, Any]


# ================================================================
# 🔍 YARDIMCI FONKSİYONLAR
# ================================================================
def _build_url(source: str, path: str) -> str:
    cfg = ALLOWED_SOURCES.get(source)
    if not cfg:
        raise ValueError(f"Unknown source: {source}")

    base = cfg["base"].rstrip("/")
    if not path.startswith("/"):
        path = "/" + path
    return base + path


def _safe_fetch(
    source: str,
    path: str,
    params: Optional[Dict[str, Any]] = None,
    method: str = "GET",
) -> Dict[str, Any]:
    """Belirli bir kaynaktan HTML/JSON çeker; hata vermez, log yazar."""
    try:
        url = _build_url(source, path)
    except Exception as e:
        log.error("build_url error: %s", e)
        return {"ok": False, "error": str(e)}

    try:
        log.info("fetch [%s] %s params=%s", source, url, params)
        resp = session.request(method=method, url=url, params=params, timeout=TIMEOUT)
        ct = resp.headers.get("content-type", "")
        # HTML ise text, JSON ise json() döndür
        if "application/json" in ct.lower():
            body: Any
            try:
                body = resp.json()
            except Exception:
                body = resp.text
        else:
            body = resp.text

        return {
            "ok": True,
            "status": resp.status_code,
            "url": resp.url,
            "content_type": ct,
            "body": body,
        }
    except Exception as e:
        log.error("fetch error [%s]: %s", source, e, exc_info=True)
        return {"ok": False, "error": str(e)}


# ================================================================
# 🌡 HEALTH
# ================================================================
@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "hoopbrain-proxy"}


# ================================================================
# 1) Genel purpose RAW proxy (FAZ-13 / diğer fazlar için)
# ================================================================
@app.post("/v1/raw", response_model=Dict[str, Any])
def raw_proxy(req: RawFetchRequest):
    if req.source not in ALLOWED_SOURCES:
        raise HTTPException(status_code=400, detail="Unknown source")

    data = _safe_fetch(
        req.source,
        req.path,
        params=req.params,
        method=req.method,
    )
    return data


# ================================================================
# 2) FAZ-23 PREMATCH META ENDPOINT
#    Buradan zeynal-bot-core tek shot'ta maç ile ilgili HAM verileri alır.
# ================================================================
@app.post("/v1/prematch-meta", response_model=PrematchMetaResponse)
def prematch_meta(req: PrematchMetaRequest):
    """
    Giriş: lig, tarih, ev / deplasman isimleri.
    Çıkış: her kaynaktan ayrı ham veri (parse edilmemiş HTML / JSON).
    FAZ-23 bu ham veriyi kendi tarafında meaning'e çevirir.
    """
    league = req.league
    date = req.date
    home = req.home_team
    away = req.away_team

    # Burada kaynaklara göre basit path/param şablonları kuruyoruz.
    # Sen istersen kendi match-id sistemini ekleyebilirsin (ör: Flashscore ID).
    sources: Dict[str, Any] = {}

    # 1) Flashscore – generic arama sayfası (örnek)
    sources["flashscore"] = _safe_fetch(
        "flashscore",
        path="/search/",
        params={"q": f"{home} {away} {league}".lower()},
    )

    # 2) Mackolik – basketbol karşılaştırma veya program sayfası
    sources["mackolik"] = _safe_fetch(
        "mackolik",
        path="/Basketball/Program/Default.aspx",
        params={},
    )

    # 3) Basketboltahmin – tahmin / analiz yazıları
    sources["basketboltahmin"] = _safe_fetch(
        "basketboltahmin",
        path="/",
        params={},
    )

    # 4) NBA – sadece NBA liginde ise anlamlı
    if league.strip().upper() == "NBA":
        sources["nba"] = _safe_fetch(
            "nba",
            path="/dunk-score",
            params={},
        )

    resp = PrematchMetaResponse(
        league=league,
        date=date,
        home_team=home,
        away_team=away,
        sources=sources,
    )
    return resp


# ================================================================
# Uvicorn entrypoint (Fly.io için)
# ================================================================
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=1)
