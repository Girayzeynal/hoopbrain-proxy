import os
import time
import math
import logging
from typing import Dict, Any

import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, request

# ================================================================
# 🔧 LOGGING
# ================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("hoopbrain-proxy")

# ================================================================
# 🔧 CONFIG
# ================================================================
DEFAULT_TIMEOUT = float(os.getenv("PROXY_TIMEOUT", "6.0"))
USER_AGENT = os.getenv(
    "PROXY_UA",
    "HoopBrainProxy/1.0 (+https://hoopbrain.xyz; bot for basketball stats)",
)

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
}

# Buraya istersen ileride API key vs eklenebilir
# Örn: BALDONTLIE_API_KEY = os.getenv("BALDONTLIE_API_KEY", "")

# ================================================================
# 🔧 FLASK APP
# ================================================================
app = Flask(__name__)


# ================================================================
# BASİT YARDIMCI: güvenli HTTP GET
# ================================================================
def safe_get(url: str, params: Dict[str, Any] | None = None) -> requests.Response | None:
    try:
        resp = requests.get(
            url,
            params=params or {},
            headers=HEADERS,
            timeout=DEFAULT_TIMEOUT,
        )
        if resp.status_code != 200:
            log.warning("GET %s status=%s", url, resp.status_code)
            return None
        return resp
    except Exception as e:
        log.error("safe_get error url=%s err=%s", url, e)
        return None


# ================================================================
# 🔎 DUMMY / ÖRNEK PROVIDER’LAR
# ================================================================
def provider_flashscore_prematch(match_key: str) -> Dict[str, Any]:
    """
    Buraya ileride gerçekten flashscore/mackolik tarzı bir kaynak bağlayacağız.
    Şimdilik:
      - sadece match_key'i parçalar
      - basit, sabit bir line ve pace tahmini döner
    """
    try:
        home, away = match_key.split("@", 1)
    except ValueError:
        home, away = match_key, "UNKNOWN"

    # TODO: gerçek scraping / API entegrasyonu
    # Şimdilik sadece iskelet:
    base_total = 160.5
    pace_factor = 1.0
    news_score = 0.0

    return {
        "source": "DUMMY_FLASH",
        "home": home,
        "away": away,
        "league": "Unknown",
        "book_total_line": base_total,
        "avg_total": base_total,
        "pace_factor": pace_factor,
        "news_score": news_score,
    }


def provider_flashscore_live(match_key: str) -> Dict[str, Any]:
    """
    Canlı maç için dummy provider.
    Buraya ileride gerçek canlı skor & tempo kaynakları gelecek.
    """
    try:
        home, away = match_key.split("@", 1)
    except ValueError:
        home, away = match_key, "UNKNOWN"

    # TODO: gerçek canlı skor ve tempo
    # Şimdilik sadece quarter=1, skor=0-0
    return {
        "source": "DUMMY_LIVE",
        "home": home,
        "away": away,
        "quarter": 1,
        "clock": "10:00",
        "home_score": 0,
        "away_score": 0,
        "live_pace": 0.0,
        "fouls_home": 0,
        "fouls_away": 0,
    }


# ================================================================
# 🔗 FAZ-23 PREMATCH & LIVE AGGREGATOR
# ================================================================
def build_faz23_prematch(match_key: str) -> Dict[str, Any]:
    """FAZ-23 prematch için ortak JSON formatı."""
    core = provider_flashscore_prematch(match_key)

    line = float(core.get("book_total_line") or 160.5)
    avg_total = float(core.get("avg_total") or line)
    pace_factor = float(core.get("pace_factor") or 1.0)
    news_score = float(core.get("news_score") or 0.0)

    # Basit spread hesabı: tempo ve haber etkisini içeri al
    spread = max(6.0, 16.0 * pace_factor + 4.0 * abs(news_score))

    return {
        "match_key": match_key,
        "home": core.get("home"),
        "away": core.get("away"),
        "league": core.get("league"),
        "line": line,
        "avg_total": avg_total,
        "pace_factor": pace_factor,
        "news_score": news_score,
        "spread": spread,
        "min_total": avg_total - spread / 2,
        "max_total": avg_total + spread / 2,
        "raw": core,
    }


def build_faz23_live(match_key: str) -> Dict[str, Any]:
    """FAZ-23 live için ortak JSON formatı."""
    live = provider_flashscore_live(match_key)

    quarter = int(live.get("quarter") or 1)
    home_score = int(live.get("home_score") or 0)
    away_score = int(live.get("away_score") or 0)
    total = home_score + away_score

    # Çok kaba bir projeksiyon: saniye başına skor * 40 dk
    # Dummy olduğu için 0 ise ortalama 160’a git
    if total <= 0 or quarter <= 0:
        proj_total = 160.0
    else:
        # 10 dk periyot varsayımı
        minutes_played = (quarter - 1) * 10.0
        if minutes_played <= 0:
            proj_total = 160.0
        else:
            pace_per_minute = total / minutes_played
            proj_total = pace_per_minute * 40.0

    news_score = 0.0  # Canlı haber etkisi ileride buraya gelir.

    spread = 14.0

    return {
        "match_key": match_key,
        "home": live.get("home"),
        "away": live.get("away"),
        "quarter": quarter,
        "clock": live.get("clock"),
        "home_score": home_score,
        "away_score": away_score,
        "live_pace": live.get("live_pace") or 0.0,
        "fouls_home": live.get("fouls_home") or 0,
        "fouls_away": live.get("fouls_away") or 0,
        "news_score": news_score,
        "proj_total": proj_total,
        "spread": spread,
        "min_total": proj_total - spread / 2,
        "max_total": proj_total + spread / 2,
        "raw": live,
    }


# ================================================================
# 🌐 ROUTES
# ================================================================
@app.get("/health")
def health():
    return jsonify({"status": "ok", "ts": time.time()})


@app.get("/proxytest")
def proxytest():
    # Telegram'daki /proxytest komutu için
    return jsonify({"pong": True, "ts": time.time()})


@app.get("/faz23/prematch")
def faz23_prematch():
    match = request.args.get("match", "").strip()
    if not match:
        return jsonify({"error": "match param gerekli, örn: FENER@EFES"}), 400

    data = build_faz23_prematch(match)
    return jsonify(data)


@app.get("/faz23/live")
def faz23_live():
    match = request.args.get("match", "").strip()
    if not match:
        return jsonify({"error": "match param gerekli, örn: LAL@BOS"}), 400

    data = build_faz23_live(match)
    return jsonify(data)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=False)
