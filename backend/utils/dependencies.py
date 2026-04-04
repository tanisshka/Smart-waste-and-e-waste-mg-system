"""
utils/dependencies.py - FastAPI dependency injection for auth & roles
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from db import get_db
from utils.auth_utils import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency: Decode JWT token and return current user from DB.
    Raises 401 if token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    db = get_db()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception

    if not user:
        raise credentials_exception

    return user


async def get_current_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency: Verify the current user has admin role.
    Raises 403 if not an admin.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
