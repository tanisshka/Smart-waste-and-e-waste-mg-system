"""
routes/user_routes.py - User-facing endpoints for waste collection requests
"""

import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from db import get_db
from models.request_model import WasteType, RequestStatus
from utils.dependencies import get_current_user
from utils.cloudinary_utils import upload_image
from utils.distance import haversine_distance

# Optional Twilio SMS
try:
    from twilio.rest import Client as TwilioClient
    TWILIO_ENABLED = all([
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN"),
        os.getenv("TWILIO_PHONE_NUMBER")
    ])
    if TWILIO_ENABLED:
        twilio_client = TwilioClient(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        )
except ImportError:
    TWILIO_ENABLED = False

router = APIRouter(tags=["User"])


def send_sms(to_phone: str, message: str):
    """Send SMS via Twilio if configured."""
    if not TWILIO_ENABLED:
        print(f"[SMS MOCK] To: {to_phone} | Message: {message}")
        return
    try:
        twilio_client.messages.create(
            body=message,
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=to_phone
        )
    except Exception as e:
        print(f"SMS send failed: {e}")


def serialize_request(req: dict) -> dict:
    """Convert MongoDB request document to JSON-serializable format."""
    return {
        "id": str(req["_id"]),
        "user_id": str(req["user_id"]),
        "name": req["name"],
        "phone": req["phone"],
        "waste_type": req["waste_type"],
        "image_url": req.get("image_url"),
        "location": req["location"],
        "address": req.get("address"),
        "notes": req.get("notes"),
        "status": req["status"],
        "assigned_driver": req.get("assigned_driver"),
        "cluster_id": req.get("cluster_id"),
        "created_at": req["created_at"].isoformat() if req.get("created_at") else None,
        "updated_at": req["updated_at"].isoformat() if req.get("updated_at") else None,
    }


@router.post("/request", status_code=status.HTTP_201_CREATED)
async def create_request(
    name: str = Form(...),
    phone: str = Form(...),
    waste_type: WasteType = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new waste collection request.
    Accepts multipart form data with optional image upload.
    """
    db = get_db()

    # Upload image to Cloudinary if provided
    image_url = None
    if image and image.filename:
        image_url = await upload_image(image, folder="smart_waste/requests")

    # Build GeoJSON location (MongoDB requires [longitude, latitude] order)
    location = {
        "type": "Point",
        "coordinates": [longitude, latitude]
    }

    # Create request document
    request_doc = {
        "user_id": ObjectId(str(current_user["_id"])),
        "name": name,
        "phone": phone,
        "waste_type": waste_type,
        "image_url": image_url,
        "location": location,
        "address": address,
        "notes": notes,
        "status": RequestStatus.PENDING,
        "assigned_driver": None,
        "cluster_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.requests.insert_one(request_doc)
    request_doc["_id"] = result.inserted_id

    # Send confirmation SMS
    send_sms(
        phone,
        f"Hi {name}! Your waste collection request has been received. "
        f"Request ID: {str(result.inserted_id)[:8].upper()}. "
        f"We'll notify you when it's assigned to a driver."
    )

    return {
        "message": "Waste collection request created successfully",
        "request": serialize_request(request_doc)
    }


@router.get("/my-requests")
async def get_my_requests(current_user: dict = Depends(get_current_user)):
    """Get all waste collection requests for the authenticated user."""
    db = get_db()

    cursor = db.requests.find(
        {"user_id": ObjectId(str(current_user["_id"]))}
    ).sort("created_at", -1)  # Newest first

    requests = []
    async for req in cursor:
        requests.append(serialize_request(req))

    return {"requests": requests, "count": len(requests)}


@router.get("/nearest-centers")
async def get_nearest_centers(
    latitude: float,
    longitude: float,
    limit: int = 5,
    max_distance_km: float = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Find nearest e-waste collection centers using MongoDB $geoNear.
    
    Args:
        latitude, longitude: User's current location
        limit: Max number of centers to return
        max_distance_km: Search radius in kilometers
    """
    db = get_db()

    max_distance_meters = max_distance_km * 1000

    # MongoDB geospatial query using $nearSphere
    cursor = db.ewaste_centers.find({
        "location": {
            "$nearSphere": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]  # [lon, lat] for GeoJSON
                },
                "$maxDistance": max_distance_meters
            }
        }
    }).limit(limit)

    centers = []
    async for center in cursor:
        lon_c, lat_c = center["location"]["coordinates"]
        distance = haversine_distance(latitude, longitude, lat_c, lon_c)

        centers.append({
            "id": str(center["_id"]),
            "name": center["name"],
            "address": center["address"],
            "phone": center.get("phone"),
            "email": center.get("email"),
            "latitude": lat_c,
            "longitude": lon_c,
            "distance_km": round(distance, 2),
            "accepted_items": center.get("accepted_items", []),
            "operating_hours": center.get("operating_hours"),
            "website": center.get("website"),
        })

    return {"centers": centers, "count": len(centers)}
