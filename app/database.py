# app/database.py

import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = None
db = None

def get_db():
    global client, db
    if db is None:
        if not MONGO_URI:
            print("⚠️ MONGO_URI not set. Database disabled.")
            return None
        try:
            client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client.get_database("finly") # Explicitly specify the 'finly' database
            print("✅ Connected to MongoDB (finly_db)")
        except Exception as e:
            print(f"❌ Database Connection Failed: {e}")
            return None
    return db

async def save_analysis_result(data: dict) -> bool:
    """
    Saves analysis result to MongoDB, falling back to local JSON if DB is unavailable.
    """
    database = get_db()
    
    # Add timestamp
    data["created_at"] = datetime.utcnow().isoformat()

    # Strategy 1: MongoDB
    if database is not None:
        try:
            import asyncio
            # Wrap the DB operation in a strict timeout to prevent DNS hangs
            result = await asyncio.wait_for(
                database["analysis_history"].insert_one(data),
                timeout=5.0
            )
            if "_id" in data:
                data["_id"] = str(data["_id"]) # Convert ObjectId to string for JSON safety
            print(f"💾 Analysis saved to MongoDB with ID: {result.inserted_id}")
            return True
        except Exception as e:
            # Remove _id if it was added but insertion failed (to stay JSON serializable)
            if "_id" in data:
                del data["_id"]
            print(f"⚠️ MongoDB save failed: {e}. Switching to local backup...")

    # Strategy 2: Local JSON Fallback
    try:
        import json
        file_path = "history.json"
        
        # Read existing
        history = []
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                try:
                    history = json.load(f)
                except json.JSONDecodeError:
                    pass # Start fresh if corrupt
        
        # Append & Save
        history.append(data)
        with open(file_path, "w") as f:
            json.dump(history, f, indent=2, default=str)
        
        print(f"💾 Analysis saved locally to {file_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to save locally: {e}")
        return False
