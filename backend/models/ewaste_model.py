"""
models/ewaste_model.py - E-Waste center data models
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class EWasteCenter(BaseModel):
    """Schema for e-waste collection centers."""
    name: str = Field(..., min_length=2)
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accepted_items: Optional[List[str]] = []
    operating_hours: Optional[str] = None
    website: Optional[str] = None


class EWasteCenterInDB(BaseModel):
    """E-waste center as stored in MongoDB with GeoJSON."""
    name: str
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    location: dict  # GeoJSON Point
    accepted_items: List[str] = []
    operating_hours: Optional[str] = None
    website: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EWasteCenterResponse(BaseModel):
    """Schema for returning e-waste center with distance."""
    id: str
    name: str
    address: str
    phone: Optional[str]
    email: Optional[str]
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    accepted_items: List[str]
    operating_hours: Optional[str]
    website: Optional[str]
