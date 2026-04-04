"""
models/request_model.py - Waste collection request models
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class WasteType(str, Enum):
    NORMAL = "normal"
    EWASTE = "e-waste"


class RequestStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"


class GeoLocation(BaseModel):
    """GeoJSON Point format for MongoDB geospatial queries."""
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class WasteRequestCreate(BaseModel):
    """Schema for creating a new waste collection request."""
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10)
    waste_type: WasteType
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    notes: Optional[str] = None


class WasteRequestInDB(BaseModel):
    """Full request model as stored in MongoDB."""
    user_id: str
    name: str
    phone: str
    waste_type: WasteType
    image_url: Optional[str] = None
    location: GeoLocation
    address: Optional[str] = None
    notes: Optional[str] = None
    status: RequestStatus = RequestStatus.PENDING
    assigned_driver: Optional[str] = None
    cluster_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WasteRequestResponse(BaseModel):
    """Schema for returning request data."""
    id: str
    user_id: str
    name: str
    phone: str
    waste_type: WasteType
    image_url: Optional[str]
    location: GeoLocation
    address: Optional[str]
    notes: Optional[str]
    status: RequestStatus
    assigned_driver: Optional[str]
    cluster_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class StatusUpdateRequest(BaseModel):
    """Schema for updating request status."""
    request_id: str
    status: RequestStatus
    assigned_driver: Optional[str] = None


class RouteOptimizationRequest(BaseModel):
    """Input for route optimization - list of request IDs."""
    request_ids: Optional[List[str]] = None  # None = optimize all pending
    n_clusters: Optional[int] = None  # Auto-detect if None
