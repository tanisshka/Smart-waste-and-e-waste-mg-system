"""
main.py - Smart Waste Collection & E-Waste Management System
FastAPI Backend Entry Point

Run with: uvicorn main:app --reload --port 8000
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from db import connect_db, close_db
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.admin_routes import router as admin_router
from routes.ewaste_routes import router as ewaste_router
from routes.route_optimizer import router as route_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect on startup, disconnect on shutdown."""
    # Startup
    await connect_db()
    await seed_initial_data()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Smart Waste Collection & E-Waste Management API",
    description="Full-stack system for managing waste collection requests and e-waste centers",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "https://smartwaste.vercel.app",  # Production (update as needed)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(admin_router)
app.include_router(ewaste_router)
app.include_router(route_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "service": "Smart Waste Collection API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    from db import get_db
    db = get_db()
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "database": db_status,
        "twilio": bool(os.getenv("TWILIO_ACCOUNT_SID")),
        "cloudinary": bool(os.getenv("CLOUDINARY_CLOUD_NAME")),
        "ors": bool(os.getenv("ORS_API_KEY")),
    }


async def seed_initial_data():
    """
    Seed the database with initial admin user and sample e-waste centers
    if they don't already exist.
    """
    from db import get_db
    from utils.auth_utils import hash_password
    from datetime import datetime

    db = get_db()

    # Create admin user if not exists
    admin_email = os.getenv("ADMIN_EMAIL", "admin@smartwaste.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")

    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await db.users.insert_one({
            "name": "System Admin",
            "email": admin_email,
            "hashed_password": hash_password(admin_password),
            "phone": "+1234567890",
            "role": "admin",
            "created_at": datetime.utcnow()
        })
        print(f"✅ Admin user created: {admin_email}")

    # Seed sample e-waste centers (Mumbai area)
    centers_count = await db.ewaste_centers.count_documents({})
    if centers_count == 0:
        sample_centers = [
            {
                "name": "Mumbai E-Waste Recyclers",
                "address": "Andheri West, Mumbai, Maharashtra 400053",
                "phone": "+91-22-2636-0001",
                "email": "info@mumbairecycle.com",
                "location": {"type": "Point", "coordinates": [72.8311, 19.1136]},
                "accepted_items": ["Phones", "Laptops", "TVs", "Batteries", "Cables"],
                "operating_hours": "Mon-Sat: 9AM-6PM",
                "website": "https://mumbairecycle.com",
                "created_at": datetime.utcnow()
            },
            {
                "name": "GreenTech E-Waste Hub",
                "address": "Kurla, Mumbai, Maharashtra 400070",
                "phone": "+91-22-2520-0002",
                "email": "contact@greentech.in",
                "location": {"type": "Point", "coordinates": [72.8826, 19.0728]},
                "accepted_items": ["Computers", "Printers", "Refrigerators", "AC Units"],
                "operating_hours": "Mon-Fri: 8AM-8PM, Sat: 9AM-5PM",
                "website": "https://greentech.in",
                "created_at": datetime.utcnow()
            },
            {
                "name": "Eco Recycle Center",
                "address": "Bandra East, Mumbai, Maharashtra 400051",
                "phone": "+91-22-2645-0003",
                "location": {"type": "Point", "coordinates": [72.8615, 19.0607]},
                "accepted_items": ["All Electronics", "Medical Devices", "Office Equipment"],
                "operating_hours": "Daily: 7AM-9PM",
                "created_at": datetime.utcnow()
            },
            {
                "name": "CleanCity E-Waste Drop-off",
                "address": "Powai, Mumbai, Maharashtra 400076",
                "phone": "+91-22-2857-0004",
                "location": {"type": "Point", "coordinates": [72.9082, 19.1176]},
                "accepted_items": ["Smartphones", "Tablets", "Cameras", "Gaming Consoles"],
                "operating_hours": "Mon-Sun: 10AM-7PM",
                "created_at": datetime.utcnow()
            },
            {
                "name": "TechReclaim Mumbai",
                "address": "Thane West, Thane, Maharashtra 400601",
                "phone": "+91-22-2540-0005",
                "location": {"type": "Point", "coordinates": [72.9781, 19.2183]},
                "accepted_items": ["Laptops", "Desktops", "Servers", "Network Equipment"],
                "operating_hours": "Mon-Sat: 9AM-5PM",
                "created_at": datetime.utcnow()
            },
        ]
        await db.ewaste_centers.insert_many(sample_centers)
        print(f"✅ Seeded {len(sample_centers)} e-waste centers")
