from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Request Schemas ---

class GenerateRequest(BaseModel):
    """Request body for image generation."""
    gender: str  # "women" or "men"
    tpo: str  # "daily", "date", "office", "active"
    height: float = 165
    fit: Optional[str] = None  # "오버핏", "슬림핏", "정핏"
    photo_base64: Optional[str] = None  # user's photo in base64


class ItemCreateRequest(BaseModel):
    """Request body for creating a clothing item."""
    name: str
    description: Optional[str] = None
    price: int
    category: Optional[str] = None
    stock_info: Optional[str] = None
    location: Optional[str] = None
    gender: Optional[str] = None


# --- Response Schemas ---

class GenerateResponse(BaseModel):
    """Response after starting generation."""
    task_id: str
    status: str  # "processing", "completed", "failed"
    message: str


class GeneratedImageResponse(BaseModel):
    """A single generated image result."""
    id: int
    image_url: str
    prompt: str
    category: Optional[str] = None
    created_at: Optional[datetime] = None


class GenerationResultResponse(BaseModel):
    """Full generation result with all images."""
    task_id: str
    status: str
    images: list[GeneratedImageResponse]
    total: int


class ItemResponse(BaseModel):
    """Clothing item response."""
    id: int
    name: str
    description: Optional[str] = None
    price: int
    price_display: str  # "₩59,000"
    category: Optional[str] = None
    image_url: Optional[str] = None
    stock_info: Optional[str] = None
    location: Optional[str] = None
    gender: Optional[str] = None

    class Config:
        from_attributes = True
