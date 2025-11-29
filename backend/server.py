from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class CircleJoinRequest(BaseModel):
    userId: str

class Circle(BaseModel):
    circleId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    day: int = 1
    status: str = "active"
    participants: List[str] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    maxParticipants: int = 7

class Message(BaseModel):
    messageId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    circleId: str
    authorId: str
    segmentIndex: int
    audioUrl: str = ""
    durationMs: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    transcript: Optional[str] = None
    emotionalTags: Optional[dict] = None

class MessageCreate(BaseModel):
    circleId: str
    authorId: str
    segmentIndex: int
    audioUrl: str
    durationMs: int

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Aura API - Anonymous Voice Circles"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Circle endpoints
@api_router.post("/circles/join")
async def join_circle(request: CircleJoinRequest):
    """Join or create a circle for the user"""
    try:
        # Check if user is already in an active circle
        existing_circle = await db.circles.find_one({
            "participants": request.userId,
            "status": "active"
        })
        
        if existing_circle:
            # Convert ObjectId to string
            existing_circle["_id"] = str(existing_circle["_id"])
            return existing_circle
        
        # Find an active circle with available slots
        available_circle = await db.circles.find_one({
            "status": "active",
            "$expr": {"$lt": [{"$size": "$participants"}, 7]}
        })
        
        if available_circle:
            # Add user to existing circle
            await db.circles.update_one(
                {"_id": available_circle["_id"]},
                {"$push": {"participants": request.userId}}
            )
            available_circle["participants"].append(request.userId)
            available_circle["_id"] = str(available_circle["_id"])
            return available_circle
        
        # Create new circle
        circle_data = Circle(participants=[request.userId])
        result = await db.circles.insert_one(circle_data.dict())
        
        new_circle = await db.circles.find_one({"_id": result.inserted_id})
        new_circle["_id"] = str(new_circle["_id"])
        return new_circle
        
    except Exception as e:
        logging.error(f"Error joining circle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/circles/{circle_id}")
async def get_circle(circle_id: str):
    """Get circle details"""
    try:
        circle = await db.circles.find_one({"_id": ObjectId(circle_id)})
        if not circle:
            raise HTTPException(status_code=404, detail="Circle not found")
        circle["_id"] = str(circle["_id"])
        return circle
    except Exception as e:
        logging.error(f"Error getting circle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/circles/{circle_id}/members")
async def get_circle_members(circle_id: str):
    """Get circle members count"""
    try:
        circle = await db.circles.find_one({"_id": ObjectId(circle_id)})
        if not circle:
            raise HTTPException(status_code=404, detail="Circle not found")
        return {"count": len(circle.get("participants", [])), "participants": circle.get("participants", [])}
    except Exception as e:
        logging.error(f"Error getting circle members: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Message endpoints
@api_router.post("/messages")
async def create_message(message: MessageCreate):
    """Create a new voice message"""
    try:
        message_data = Message(**message.dict())
        result = await db.messages.insert_one(message_data.dict())
        
        new_message = await db.messages.find_one({"_id": result.inserted_id})
        new_message["_id"] = str(new_message["_id"])
        return new_message
    except Exception as e:
        logging.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/{circle_id}")
async def get_messages(circle_id: str):
    """Get all messages for a circle"""
    try:
        messages = await db.messages.find({"circleId": circle_id}).to_list(1000)
        for msg in messages:
            msg["_id"] = str(msg["_id"])
        return messages
    except Exception as e:
        logging.error(f"Error getting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
