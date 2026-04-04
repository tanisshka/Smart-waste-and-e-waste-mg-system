"""
routes/auth_routes.py - User registration and login endpoints
"""

import os
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from datetime import datetime
from db import get_db
from models.user_model import UserCreate, UserLogin, TokenResponse
from utils.auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to JSON-serializable format."""
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user["role"],
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user account.
    - Checks for duplicate email
    - Hashes password before storing
    - Returns JWT token immediately (no separate login needed)
    """
    db = get_db()

    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "hashed_password": hash_password(user_data.password),
        "phone": user_data.phone,
        "role": "user",
        "created_at": datetime.utcnow()
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Generate token
    token = create_access_token({"sub": str(result.inserted_id), "role": "user"})

    return TokenResponse(
        access_token=token,
        user=serialize_user(user_doc)
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Authenticate user with email + password.
    Returns JWT token on success.
    """
    db = get_db()

    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": str(user["_id"]),
        "role": user["role"]
    })

    return TokenResponse(
        access_token=token,
        user=serialize_user(user)
    )


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(credentials: UserLogin):
    """
    Admin-specific login endpoint.
    Validates that the user has admin role.
    """
    db = get_db()

    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required"
        )

    token = create_access_token({
        "sub": str(user["_id"]),
        "role": "admin"
    })

    return TokenResponse(
        access_token=token,
        user=serialize_user(user)
    )
