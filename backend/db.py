"""
db.py - MongoDB connection and collection management
Uses Motor (async MongoDB driver) for non-blocking operations
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Initialize MongoDB connection and create indexes."""
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.smart_waste

    # Create geospatial index on requests collection
    await db.requests.create_index([("location", "2dsphere")])

    # Create geospatial index on ewaste_centers collection
    await db.ewaste_centers.create_index([("location", "2dsphere")])

    # Create unique index on user email
    await db.users.create_index("email", unique=True)

    print("✅ Connected to MongoDB and indexes created")
    return db


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    """Return the active database instance."""
    return db
