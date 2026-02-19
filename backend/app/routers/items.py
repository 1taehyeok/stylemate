"""
Items Router - CRUD for clothing items catalog.
"""
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ClothingItem
from app.schemas import ItemCreateRequest, ItemResponse, ItemUpdateRequest
from app.services.admin_audit import write_admin_audit_log
from app.services.admin_security import validate_admin_session

router = APIRouter(prefix="/api", tags=["items"])


def _format_price(price: int) -> str:
    return f"{price:,}"


@router.get("/items", response_model=list[ItemResponse])
async def list_items(
    gender: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
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
async def create_item(request: ItemCreateRequest, db: AsyncSession = Depends(get_db)):
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
    result = await db.execute(select(ClothingItem).where(ClothingItem.id == item_id))
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


@router.patch("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    request: ItemUpdateRequest,
    req: Request,
    x_admin_session: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    admin_id = validate_admin_session(x_admin_session)
    if not admin_id:
        await write_admin_audit_log(
            db,
            event_type="item_update",
            success=False,
            admin_id=None,
            session_token=x_admin_session,
            ip_address=req.client.host if req.client else None,
            user_agent=req.headers.get("user-agent"),
            detail={"item_id": item_id, "reason": "unauthorized"},
        )
        raise HTTPException(status_code=401, detail="Unauthorized admin session")

    result = await db.execute(select(ClothingItem).where(ClothingItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        await write_admin_audit_log(
            db,
            event_type="item_update",
            success=False,
            admin_id=admin_id,
            session_token=x_admin_session,
            ip_address=req.client.host if req.client else None,
            user_agent=req.headers.get("user-agent"),
            detail={"item_id": item_id, "reason": "item_not_found"},
        )
        raise HTTPException(status_code=404, detail="Item not found")

    payload = request.model_dump(exclude_unset=True)
    if "price" in payload and payload["price"] is not None and payload["price"] < 0:
        raise HTTPException(status_code=400, detail="price must be non-negative")

    before = {
        "name": item.name,
        "price": item.price,
        "category": item.category,
        "stock_info": item.stock_info,
        "location": item.location,
        "gender": item.gender,
    }

    for key, value in payload.items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)

    await write_admin_audit_log(
        db,
        event_type="item_update",
        success=True,
        admin_id=admin_id,
        session_token=x_admin_session,
        ip_address=req.client.host if req.client else None,
        user_agent=req.headers.get("user-agent"),
        detail={
            "item_id": item.id,
            "before": before,
            "after": {
                "name": item.name,
                "price": item.price,
                "category": item.category,
                "stock_info": item.stock_info,
                "location": item.location,
                "gender": item.gender,
            },
        },
    )

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
