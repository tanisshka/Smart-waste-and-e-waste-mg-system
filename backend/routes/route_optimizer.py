"""
routes/route_optimizer.py - Route visualization using OpenRouteService or OSRM
Provides turn-by-turn routing data for frontend map display.
"""

import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from utils.dependencies import get_current_user

router = APIRouter(prefix="/route", tags=["Route Visualization"])

ORS_API_KEY = os.getenv("ORS_API_KEY", "")
ORS_BASE_URL = "https://api.openrouteservice.org/v2"
OSRM_BASE_URL = "http://router.project-osrm.org/route/v1"


@router.get("/directions")
async def get_directions(
    from_lat: float,
    from_lon: float,
    to_lat: float,
    to_lon: float,
    current_user: dict = Depends(get_current_user)
):
    """
    Get driving directions between two points.
    Tries OpenRouteService first, falls back to OSRM (free, no key required).
    
    Returns:
        GeoJSON route geometry + distance + duration
    """

    # Try OpenRouteService if API key is configured
    if ORS_API_KEY:
        try:
            return await _get_ors_directions(from_lat, from_lon, to_lat, to_lon)
        except Exception as e:
            print(f"ORS failed, falling back to OSRM: {e}")

    # Fallback to OSRM (free, open source)
    return await _get_osrm_directions(from_lat, from_lon, to_lat, to_lon)


async def _get_ors_directions(from_lat, from_lon, to_lat, to_lon):
    """Fetch route from OpenRouteService API."""
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{ORS_BASE_URL}/directions/driving-car/geojson",
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "coordinates": [
                    [from_lon, from_lat],
                    [to_lon, to_lat]
                ]
            }
        )
        response.raise_for_status()
        data = response.json()

        feature = data["features"][0]
        props = feature["properties"]["summary"]

        return {
            "source": "openrouteservice",
            "geometry": feature["geometry"],
            "distance_km": round(props["distance"] / 1000, 2),
            "duration_minutes": round(props["duration"] / 60),
            "from": {"lat": from_lat, "lon": from_lon},
            "to": {"lat": to_lat, "lon": to_lon}
        }


async def _get_osrm_directions(from_lat, from_lon, to_lat, to_lon):
    """Fetch route from OSRM (free, no API key needed)."""
    coords = f"{from_lon},{from_lat};{to_lon},{to_lat}"
    url = f"{OSRM_BASE_URL}/driving/{coords}"

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params={
            "overview": "full",
            "geometries": "geojson",
            "steps": "false"
        })
        response.raise_for_status()
        data = response.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            raise HTTPException(status_code=502, detail="No route found")

        route = data["routes"][0]

        return {
            "source": "osrm",
            "geometry": route["geometry"],
            "distance_km": round(route["distance"] / 1000, 2),
            "duration_minutes": round(route["duration"] / 60),
            "from": {"lat": from_lat, "lon": from_lon},
            "to": {"lat": to_lat, "lon": to_lon}
        }
