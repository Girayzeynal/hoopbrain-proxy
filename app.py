import os
import logging
from typing import Dict, Any

import requests
from flask import Flask, jsonify

log = logging.getLogger("hoopbrain-proxy")
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

USER_AGENT = os.getenv(
    "HPB_PROXY_UA",
    "Mozilla/5.0 (compatible; HoopBrainProxy/1.0; +https://hoopbrain.xyz)",
)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

# ------------------------------------------------
# Yardımcı
# ------------------------------------------------
def _safe_get(url: str, params: Dict[str, Any] | None = None) -> Any:
    try:
        resp = SESSION.get(url, params=params or {}, timeout=4)
        resp.raise_for_status()
        return resp
    except Exception as e:
        log.warning("proxy fetch error %s %s", url, e)
        return None


# ------------------------------------------------
# ÖRNEK PROVIDERLAR (SENİN TUNE ETMEN GEREK)
# Bunlar mimariyi göstermek için; URL / parse kısımlarını
# kendi testine göre güncellersin.
# ------------------------------------------------

def fetch_nba(match_key: str) -> Dict[str, Any]:
    """
    match_key: örn 'LAL@BOS'
    NBA resmi endpointleri sık değiştiği için bu sadece şablon.
    """
    return {
        "league": "NBA",
        "avg_total": 228.0,
        "market_total": 230.5,
        "pace_index": 1.05,
    }


def fetch_euroleague(match_key: str) -> Dict[str, Any]:
    return {
        "league": "EUROLEAGUE",
        "avg_total": 163.0,
        "market_total": 164.5,
        "pace_index": 0.99,
    }


def fetch_mackolik(match_key: str) -> Dict[str, Any]:
    """
    match_key: 'FENER@EFES' gibi;
    sen bunu Mackolik URL'ine çeviren bir map tutabilirsin.
    Burada sadece kabaca bir skeleton var.
    """
    # url = "https://arsiv.mackolik.com/Basketball/Comparison/Default.aspx?id=XXXX"
    # resp = _safe_get(url)
    # HTML parse vs...
    return {
        "league": "TR",
        "avg_total": 155.0,
        "market_total": 157.5,
        "pace_index": 0.97,
    }


def fetch_live_score(match_key: str) -> Dict[str, Any]:
    """
    Canlı skor / tempo / foul gibi veriler için
    FlashScore veya benzeri kaynaktan çekilen data.
    Şimdilik dummy.
    """
    return {
        "home_score": 70,
        "away_score": 63,
        "quarter": 3,
        "seconds_elapsed": 30 * 60,  # 30. dk gibi düşün
        "pace_index": 1.08,
        "fouls_factor": 0.2,
    }


def fetch_news_bias(match_key: str) -> Dict[str, Any]:
    """
    Google News / RSS / spor sitelerinden scraping ile
    "pace artacak mı, eksik var mı" gibi şeylerden -1..+1 bias çıkarabilirsin.
    Şimdilik dummy.
    """
    return {
        "prematch_bias": 0.15,
        "live_bias": 0.10,
    }


# ------------------------------------------------
# FÜZYON
# ------------------------------------------------
def build_meta_for_match(match_key: str) -> Dict[str, Any]:
    """
    Burada istediğin kadar provider'ı birleştirirsin.
    """
    # Örnek: lig belirlemek için match_key'e bakabilirsin
    key_up = match_key.upper()

    if "@" not in key_up:
        league = "UNKNOWN"
    elif any(x in key_up for x in ["LAL", "BOS", "GSW", "NYK"]):
        league = "NBA"
    elif any(x in key_up for x in ["FENER", "EFES", "GS", "BJK", "DARUSSAFAKA"]):
        league = "TR"
    else:
        league = "EURO"

    if league == "NBA":
        base = fetch_nba(match_key)
    elif league == "EURO":
        base = fetch_euroleague(match_key)
    else:
        base = fetch_mackolik(match_key)

    live = fetch_live_score(match_key)
    news = fetch_news_bias(match_key)

    avg_total = float(base.get("avg_total", 0.0))
    market_total = float(base.get("market_total", 0.0))
    pace_index = float(base.get("pace_index", 1.0))

    center_guess = market_total or avg_total or 160.0

    return {
        "match_key": match_key,
        "league": league,
        "prematch": {
            "avg_total": avg_total,
            "market_total": market_total,
            "pace_index": pace_index,
            "center_guess": center_guess,
        },
        "live": live,
        "news": news,
    }


# ------------------------------------------------
# ROUTES
# ------------------------------------------------

@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.get("/meta/<match_key>")
def meta(match_key: str):
    data = build_meta_for_match(match_key)
    return jsonify(data)
