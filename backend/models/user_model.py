"""
models/user_model.py - User data models and schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for returning user data (no password)."""
    id: str
    name: str
    email: str
    phone: Optional[str]
    role: UserRole
    created_at: datetime


class UserInDB(BaseModel):
    """Full user model as stored in MongoDB."""
    name: str
    email: str
    hashed_password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict
