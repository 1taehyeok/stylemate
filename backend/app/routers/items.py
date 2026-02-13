"""
Items Router — CRUD for clothing items catalog.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import ClothingItem
from app.schemas import ItemCreateRequest, ItemResponse

router = APIRouter(prefix="/api", tags=["items"])


def _format_price(price: int) -> str:
    """Format price with Korean Won symbol."""
    return f"₩{price:,}"


@router.get("/items", response_model=list[ItemResponse])
async def list_items(
    gender: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List all clothing items, optionally filtered."""
    query = select(ClothingItem)
    if gender:
        query = query.where(ClothingItem.gender == gender)
    if category:
        query = query.where(ClothingItem.category == category)

    result = await db.execute(query.order_by(ClothingItem.id))
    items = result.scalars().all()

    return [
        ItemResponse(
            id=item.id,
            name=item.name,
            description=item.description,
            price=item.price,
            price_display=_format_price(item.price),
            category=item.category,
            image_url=f"/static/images/{item.image_path}" if item.image_path else None,
            stock_info=item.stock_info,
            location=item.location,
            gender=item.gender,
        )
        for item in items
    ]


@router.post("/items", response_model=ItemResponse)
async def create_item(
    request: ItemCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a new clothing item (admin)."""
    item = ClothingItem(
        name=request.name,
        description=request.description,
        price=request.price,
        category=request.category,
        stock_info=request.stock_info,
        location=request.location,
        gender=request.gender,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return ItemResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        price=item.price,
        price_display=_format_price(item.price),
        category=item.category,
        image_url=f"/static/images/{item.image_path}" if item.image_path else None,
        stock_info=item.stock_info,
        location=item.location,
        gender=item.gender,
    )


@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single clothing item by ID."""
    result = await db.execute(
        select(ClothingItem).where(ClothingItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return ItemResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        price=item.price,
        price_display=_format_price(item.price),
        category=item.category,
        image_url=f"/static/images/{item.image_path}" if item.image_path else None,
        stock_info=item.stock_info,
        location=item.location,
        gender=item.gender,
    )
