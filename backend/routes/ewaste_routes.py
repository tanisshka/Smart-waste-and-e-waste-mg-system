"""
routes/ewaste_routes.py - E-waste center public endpoints
"""

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from db import get_db

router = APIRouter(prefix="/ewaste", tags=["E-Waste Centers"])


@router.get("/centers")
async def list_centers(limit: int = 20):
    """Public: List all e-waste collection centers."""
    db = get_db()
    cursor = db.ewaste_centers.find({}).limit(limit)
    centers = []
    async for center in cursor:
        lon, lat = center["location"]["coordinates"]
        centers.append({
            "id": str(center["_id"]),
            "name": center["name"],
            "address": center["address"],
            "latitude": lat,
            "longitude": lon,
            "phone": center.get("phone"),
            "email": center.get("email"),
            "accepted_items": center.get("accepted_items", []),
            "operating_hours": center.get("operating_hours"),
            "website": center.get("website"),
        })
    return {"centers": centers}


@router.get("/centers/{center_id}")
async def get_center(center_id: str):
    """Public: Get a single e-waste center by ID."""
    db = get_db()
    try:
        center = await db.ewaste_centers.find_one({"_id": ObjectId(center_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid center ID")

    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    lon, lat = center["location"]["coordinates"]
    return {
        "id": str(center["_id"]),
        "name": center["name"],
        "address": center["address"],
        "latitude": lat,
        "longitude": lon,
        "phone": center.get("phone"),
        "email": center.get("email"),
        "accepted_items": center.get("accepted_items", []),
        "operating_hours": center.get("operating_hours"),
        "website": center.get("website"),
    }
