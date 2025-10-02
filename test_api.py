"""
FastAPI proxy/service for iNaturalist API
File: fastapi_inaturalist_proxy.py

What it does:
- Exposes simple endpoints that call the iNaturalist public API (https://api.inaturalist.org/v1/)
- Forwards query params safely, supports pagination
- Handles basic retry/backoff on 429/500 errors
- Optional bearer token via env var INAT_TOKEN for authenticated requests
- Simple in-memory TTL cache to reduce repeated calls

Usage:
1) Create virtualenv and install dependencies:
   python -m venv .venv
   source .venv/bin/activate   # or .venv\Scripts\Activate.ps1 on Windows
   pip install fastapi uvicorn httpx cachetools

2) Run the app:
   uvicorn fastapi_inaturalist_proxy:app --host 0.0.0.0 --port 8000

3) Example calls:
   GET http://localhost:8000/observations?per_page=5
   GET http://localhost:8000/observations/123456
   GET http://localhost:8000/taxa/48662

Notes:
- This is a minimal, pragmatic implementation for development and small demos.
- For production: add persistent caching, proper rate-limit middleware, logging, auth, and monitoring.
"""

import os
import asyncio
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.responses import JSONResponse
import httpx
from cachetools import TTLCache, cached

# Configuration
INAT_BASE = "https://api.inaturalist.org/v1"
INAT_TOKEN = os.getenv("INAT_TOKEN")  # optional personal token for private endpoints
MAX_CONCURRENT = int(os.getenv("INAT_MAX_CONCURRENT", "8"))  # concurrent requests to INAT
CACHE_TTL = int(os.getenv("INAT_CACHE_TTL", "30"))  # seconds
CACHE_MAXSIZE = int(os.getenv("INAT_CACHE_MAXSIZE", "1024"))

# HTTPX Async client - will be created on startup
client: Optional[httpx.AsyncClient] = None
sem = asyncio.Semaphore(MAX_CONCURRENT)

# Simple in-memory TTL cache
_cache = TTLCache(maxsize=CACHE_MAXSIZE, ttl=CACHE_TTL)

app = FastAPI(title="iNaturalist proxy service", version="0.1")


async def _get_headers() -> Dict[str, str]:
    headers = {"Accept": "application/json", "User-Agent": "fastapi-inat-proxy/0.1"}
    if INAT_TOKEN:
        headers["Authorization"] = f"Bearer {INAT_TOKEN}"
    return headers


async def fetch_with_retry(path: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch from iNaturalist with simple retry/backoff logic and concurrency limiting."""
    url = INAT_BASE.rstrip("/") + "/" + path.lstrip("/")
    # create a cache key from url + sorted params
    key = url + "?" + "&".join(f"{k}={params[k]}" for k in sorted(params))

    # quick cache hit
    if key in _cache:
        return _cache[key]

    # Acquire semaphore to limit concurrency
    async with sem:
        headers = await _get_headers()
        last_exc = None
        backoff = 1.0
        for attempt in range(6):
            try:
                global client
                if client is None:
                    client = httpx.AsyncClient(timeout=20.0)
                resp = await client.get(url, params=params, headers=headers)
                # If rate limited, backoff and retry
                if resp.status_code == 429:
                    # look for Retry-After header
                    ra = resp.headers.get("Retry-After")
                    wait = float(ra) if ra and ra.isdigit() else backoff
                    await asyncio.sleep(wait)
                    backoff *= 2
                    continue
                # For server errors, retry a few times
                if 500 <= resp.status_code < 600:
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue
                # Raise for other 4xx
                resp.raise_for_status()
                data = resp.json()
                _cache[key] = data
                return data
            except httpx.HTTPStatusError as e:
                # non-2xx and not handled above
                last_exc = e
                break
            except (httpx.RequestError, asyncio.TimeoutError) as e:
                last_exc = e
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
        # If we exit loop with no return
        if last_exc is not None:
            raise HTTPException(status_code=502, detail=f"Upstream request failed: {last_exc}")
        raise HTTPException(status_code=504, detail="Upstream timed out or unavailable")


def _safe_forward_params(request: Request, allowed_extra: Optional[set] = None) -> Dict[str, Any]:
    """Forward query params from incoming request to iNaturalist, but avoid dangerous ones.
    allowed_extra: additional params to forward (strings)
    """
    allowed_extra = allowed_extra or set()
    params = {}
    for k, v in request.query_params.multi_items():
        # basic whitelist: allow common query params; otherwise forward only if in allowed_extra
        if k in {
            "page",
            "per_page",
            "taxon_id",
            "place_id",
            "user_id",
            "project_id",
            "order_by",
            "order",
            "q",
            "d1",
            "d2",
            "verifiable",
            "quality_grade",
        } or k in allowed_extra:
            params[k] = v
    # default: per_page <= 100
    if "per_page" in params:
        try:
            per = int(params["per_page"])
            params["per_page"] = str(min(per, 100))
        except Exception:
            params["per_page"] = "30"
    else:
        params["per_page"] = "30"
    return params


@app.on_event("shutdown")
async def _shutdown():
    global client
    if client is not None:
        await client.aclose()


from typing import Optional
from fastapi import Query

@app.get("/observations")
async def get_observations(
    taxon_id: Optional[int] = Query(None, description="Filter by taxon id"),
    place_id: Optional[int] = Query(None, description="Filter by place id"),
    user_id: Optional[str] = Query(None, description="Filter by user login or id"),
    project_id: Optional[int] = Query(None, description="Filter by project id"),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    order_by: Optional[str] = Query(None),
    order: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Fulltext search"),
    d1: Optional[str] = Query(None, description="date from (YYYY-MM-DD)"),
    d2: Optional[str] = Query(None, description="date to (YYYY-MM-DD)"),
    verifiable: Optional[bool] = Query(None),
    quality_grade: Optional[str] = Query(None),
):
    # build params dict only with not-None values
    params = {}
    for k, v in {
        "taxon_id": taxon_id,
        "place_id": place_id,
        "user_id": user_id,
        "project_id": project_id,
        "page": page,
        "per_page": per_page,
        "order_by": order_by,
        "order": order,
        "q": q,
        "d1": d1,
        "d2": d2,
        "verifiable": verifiable,
        "quality_grade": quality_grade,
    }.items():
        if v is not None:
            params[k] = str(v).lower() if isinstance(v, bool) else str(v)

    data = await fetch_with_retry("observations", params)
    return JSONResponse(content=data)


@app.get("/observations/{obs_id}")
async def get_observation_by_id(obs_id: int):
    data = await fetch_with_retry(f"observations/{obs_id}", {})
    return JSONResponse(content=data)


@app.get("/taxa/{taxon_id}")
async def get_taxon(taxon_id: int):
    data = await fetch_with_retry(f"taxa/{taxon_id}", {})
    return JSONResponse(content=data)


@app.get("/users/{username}")
async def get_user(username: str, per_page: int = Query(30, ge=1, le=100)):
    params = {"per_page": str(per_page)}
    data = await fetch_with_retry(f"users/{username}", params)
    return JSONResponse(content=data)


@app.get("/health")
async def health():
    return {"status": "ok"}
