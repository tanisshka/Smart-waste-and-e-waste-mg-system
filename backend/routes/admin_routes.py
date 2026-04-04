"""
routes/admin_routes.py - Admin dashboard and management endpoints
"""

import os
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from db import get_db
from models.request_model import StatusUpdateRequest, RequestStatus, RouteOptimizationRequest
from utils.dependencies import get_current_admin
from utils.clustering import cluster_requests, optimize_cluster_routes

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

router = APIRouter(prefix="/admin", tags=["Admin"])


def send_sms(to_phone: str, message: str):
    """Send SMS via Twilio if configured, else print mock."""
    if not TWILIO_ENABLED:
        print(f"[SMS MOCK] To: {to_phone} | {message}")
        return
    try:
        twilio_client.messages.create(
            body=message,
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=to_phone
        )
    except Exception as e:
        print(f"SMS failed: {e}")


def serialize_request(req: dict) -> dict:
    """Convert MongoDB request to JSON-serializable format."""
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


@router.get("/requests")
async def get_all_requests(
    status: Optional[str] = None,
    waste_type: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """
    Admin: Get all waste collection requests with optional filters.
    Supports filtering by status and waste_type with pagination.
    """
    db = get_db()

    # Build dynamic query filter
    query = {}
    if status:
        query["status"] = status
    if waste_type:
        query["waste_type"] = waste_type

    skip = (page - 1) * limit
    total = await db.requests.count_documents(query)

    cursor = db.requests.find(query).sort("created_at", -1).skip(skip).limit(limit)

    requests = []
    async for req in cursor:
        requests.append(serialize_request(req))

    return {
        "requests": requests,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/stats")
async def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    """Admin: Get summary statistics for the dashboard."""
    db = get_db()

    total = await db.requests.count_documents({})
    pending = await db.requests.count_documents({"status": "pending"})
    assigned = await db.requests.count_documents({"status": "assigned"})
    in_progress = await db.requests.count_documents({"status": "in-progress"})
    completed = await db.requests.count_documents({"status": "completed"})
    ewaste = await db.requests.count_documents({"waste_type": "e-waste"})
    normal = await db.requests.count_documents({"waste_type": "normal"})
    total_users = await db.users.count_documents({"role": "user"})
    total_centers = await db.ewaste_centers.count_documents({})

    return {
        "total_requests": total,
        "pending": pending,
        "assigned": assigned,
        "in_progress": in_progress,
        "completed": completed,
        "ewaste_requests": ewaste,
        "normal_requests": normal,
        "total_users": total_users,
        "total_centers": total_centers
    }


@router.put("/update-status")
async def update_request_status(
    update: StatusUpdateRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    Admin: Update the status of a waste collection request.
    Sends SMS notification on status change.
    """
    db = get_db()

    try:
        obj_id = ObjectId(update.request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    req = await db.requests.find_one({"_id": obj_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Update fields
    update_doc = {
        "status": update.status,
        "updated_at": datetime.utcnow()
    }
    if update.assigned_driver:
        update_doc["assigned_driver"] = update.assigned_driver

    await db.requests.update_one({"_id": obj_id}, {"$set": update_doc})

    # Send SMS notification based on new status
    phone = req.get("phone")
    name = req.get("name", "User")
    req_id = str(obj_id)[:8].upper()

    status_messages = {
        "assigned": f"Hi {name}! Your waste request #{req_id} has been assigned to a driver. They'll be on their way soon!",
        "in-progress": f"Hi {name}! Our driver is on the way to collect your waste (Request #{req_id}). Please be available.",
        "completed": f"Hi {name}! Your waste collection (Request #{req_id}) has been completed. Thank you for keeping our city clean! 🌍",
    }

    if phone and update.status in status_messages:
        send_sms(phone, status_messages[update.status])

    return {"message": f"Request status updated to '{update.status}'", "request_id": update.request_id}


@router.post("/optimize-route")
async def optimize_routes(
    params: RouteOptimizationRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    Admin: Group pending requests into clusters and generate optimized pickup routes.
    
    Algorithm:
    1. K-Means clustering to group nearby requests geographically
    2. Nearest Neighbor TSP on each cluster for optimal pickup order
    
    Returns route plans with ordered stops, distances, and ETAs.
    """
    db = get_db()

    # Fetch requests to optimize
    if params.request_ids:
        # Specific request IDs provided
        obj_ids = [ObjectId(rid) for rid in params.request_ids]
        cursor = db.requests.find({"_id": {"$in": obj_ids}})
    else:
        # Default: all pending/assigned requests
        cursor = db.requests.find({
            "status": {"$in": ["pending", "assigned"]}
        })

    requests = []
    async for req in cursor:
        req["_id"] = str(req["_id"])
        req["user_id"] = str(req["user_id"])
        if req.get("created_at"):
            req["created_at"] = req["created_at"].isoformat()
        if req.get("updated_at"):
            req["updated_at"] = req["updated_at"].isoformat()
        requests.append(req)

    if not requests:
        return {"message": "No requests found to optimize", "routes": []}

    if len(requests) < 2:
        return {
            "message": "Need at least 2 requests for route optimization",
            "routes": []
        }

    # Step 1: K-Means clustering
    clusters = cluster_requests(requests, n_clusters=params.n_clusters)

    # Step 2: TSP optimization on each cluster
    route_plans = optimize_cluster_routes(clusters)

    # Update cluster assignments in database
    for plan in route_plans:
        cluster_id = plan["cluster_id"]
        for req in plan["ordered_requests"]:
            await db.requests.update_one(
                {"_id": ObjectId(req["_id"])},
                {"$set": {"cluster_id": cluster_id, "updated_at": datetime.utcnow()}}
            )

    return {
        "message": f"Optimized {len(requests)} requests into {len(route_plans)} routes",
        "total_requests": len(requests),
        "total_clusters": len(route_plans),
        "routes": route_plans
    }


@router.post("/assign-route")
async def assign_route_to_driver(
    cluster_id: int,
    driver_name: str,
    admin: dict = Depends(get_current_admin)
):
    """
    Admin: Assign all requests in a cluster to a specific driver.
    Updates status to 'assigned' and sends SMS notifications.
    """
    db = get_db()

    # Find all requests in this cluster
    cursor = db.requests.find({"cluster_id": cluster_id})
    requests = []
    async for req in cursor:
        requests.append(req)

    if not requests:
        raise HTTPException(status_code=404, detail=f"No requests found in cluster {cluster_id}")

    # Update all requests in cluster
    now = datetime.utcnow()
    await db.requests.update_many(
        {"cluster_id": cluster_id},
        {"$set": {
            "status": "assigned",
            "assigned_driver": driver_name,
            "updated_at": now
        }}
    )

    # Send SMS to each user in the cluster
    for req in requests:
        phone = req.get("phone")
        name = req.get("name", "User")
        req_id = str(req["_id"])[:8].upper()
        if phone:
            send_sms(
                phone,
                f"Hi {name}! Your waste pickup request #{req_id} has been assigned to driver {driver_name}. "
                f"They will collect your waste soon!"
            )

    return {
        "message": f"Cluster {cluster_id} assigned to {driver_name}",
        "requests_assigned": len(requests),
        "driver": driver_name
    }


@router.get("/centers")
async def get_all_centers(admin: dict = Depends(get_current_admin)):
    """Admin: List all e-waste centers."""
    db = get_db()
    cursor = db.ewaste_centers.find({})
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
            "accepted_items": center.get("accepted_items", []),
            "operating_hours": center.get("operating_hours"),
        })
    return {"centers": centers}


@router.post("/centers")
async def add_center(
    name: str,
    address: str,
    latitude: float,
    longitude: float,
    phone: Optional[str] = None,
    operating_hours: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Admin: Add a new e-waste collection center."""
    db = get_db()

    center_doc = {
        "name": name,
        "address": address,
        "phone": phone,
        "location": {
            "type": "Point",
            "coordinates": [longitude, latitude]
        },
        "operating_hours": operating_hours,
        "accepted_items": [],
        "created_at": datetime.utcnow()
    }

    result = await db.ewaste_centers.insert_one(center_doc)
    return {"message": "Center added", "id": str(result.inserted_id)}
