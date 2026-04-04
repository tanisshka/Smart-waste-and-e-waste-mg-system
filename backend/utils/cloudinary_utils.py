"""
utils/cloudinary_utils.py - Cloudinary image upload and management
"""

import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary with env credentials
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def upload_image(file: UploadFile, folder: str = "smart_waste") -> str:
    """
    Upload an image file to Cloudinary.
    
    Args:
        file: FastAPI UploadFile object
        folder: Cloudinary folder to store image in
    
    Returns:
        Secure URL of the uploaded image
    
    Raises:
        HTTPException: If file type invalid or upload fails
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed. Use JPEG, PNG, or WebP."
        )

    # Read file bytes
    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 10MB limit"
        )

    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image",
            transformation=[
                {"width": 1200, "crop": "limit"},  # Resize large images
                {"quality": "auto"},                 # Auto compress
                {"fetch_format": "auto"}             # Serve as WebP when supported
            ]
        )
        return result["secure_url"]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image upload failed: {str(e)}"
        )


async def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by public_id."""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception:
        return False
