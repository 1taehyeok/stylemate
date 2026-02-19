from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# --- Request Schemas ---

class GenerateRequest(BaseModel):
    """Request body for image generation."""
    gender: str  # "women" or "men"
    tpo: str  # "daily", "date", "office", "active"
    season: Optional[str] = None  # "spring", "summer", "fall", "winter"
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


class ItemUpdateRequest(BaseModel):
    """Request body for updating a clothing item."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    category: Optional[str] = None
    stock_info: Optional[str] = None
    location: Optional[str] = None
    gender: Optional[str] = None


class AdminAuthRequest(BaseModel):
    password: str
    device_id: Optional[str] = None


class AdminAuthResponse(BaseModel):
    success: bool
    message: str
    session_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class AdminLogResponse(BaseModel):
    id: int
    event_type: str
    success: bool
    admin_id: Optional[str] = None
    session_token: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    detail: Optional[str] = None
    created_at: Optional[datetime] = None


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


class OutfitComboResponse(BaseModel):
    combo_id: str
    image_id: int
    image_url: str
    category: Optional[str] = None
    total_price: int
    total_price_display: str
    items: list[ItemResponse]


class GenerationResultResponse(BaseModel):
    """Full generation result with generated images and recommended catalog items."""
    task_id: str
    status: str
    images: list[GeneratedImageResponse]
    total: int
    recommended_items: list[ItemResponse] = Field(default_factory=list)
    outfit_combos: list[OutfitComboResponse] = Field(default_factory=list)


class ClothingFeatureResponse(BaseModel):
    item_type: str
    color: Optional[str] = None
    style: Optional[str] = None
    season: Optional[str] = None
    fit: Optional[str] = None
    formality: Optional[int] = None
    warmth: Optional[int] = None


class OutfitPreviewItem(BaseModel):
    id: int
    name: str
    image_url: Optional[str] = None
    item_type: str


class OutfitPreviewResponse(BaseModel):
    score: int
    reason: str
    items: list[OutfitPreviewItem]


class OutfitPreviewListResponse(BaseModel):
    total: int
    combos: list[OutfitPreviewResponse]
