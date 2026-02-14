"""
Generation Router — handles AI image generation requests.
"""
import uuid
import asyncio
import logging
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import GeneratedImage, ClothingItem
from app.schemas import (
    GenerateRequest,
    GenerateResponse,
    GenerationResultResponse,
    GeneratedImageResponse,
    ItemResponse,
)
from app.config import get_settings
from app.services.ai_service import (
    get_ai_provider,
    build_prompt,
    build_category,
    save_image,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["generation"])

# In-memory task status tracking
_task_status: dict[str, str] = {}


def _format_price(price: int) -> str:
    return f"₩{price:,}"


def _to_item_response(item: ClothingItem) -> ItemResponse:
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


async def _generate_images_task(
    task_id: str,
    request: GenerateRequest,
    num_images: int = 8,
):
    """Background task: generate multiple style images and save to DB."""
    settings = get_settings()
    provider = get_ai_provider()

    _task_status[task_id] = "processing"

    try:
        from app.database import async_session
        async with async_session() as db:
            generated_count = 0

            for i in range(num_images):
                try:
                    # Vary the prompt slightly for diversity
                    base_prompt = build_prompt(
                        request.gender, request.tpo, request.height, request.fit
                    )
                    variation = [
                        "with a coat and trousers",
                        "with a blazer and slacks",
                        "with a sweater and jeans",
                        "with a dress shirt and chinos",
                        "with a casual t-shirt and joggers",
                        "with a cardigan and skirt",
                        "with a hoodie and cargo pants",
                        "with a knit top and wide pants",
                        "with a formal suit",
                        "with a denim jacket and sneakers",
                        "with a trench coat and boots",
                        "with a polo shirt and shorts",
                    ]
                    full_prompt = f"{base_prompt} Style variation: {variation[i % len(variation)]}"

                    # Generate image
                    image_bytes = await provider.generate_image(
                        prompt=full_prompt,
                        reference_image_b64=request.photo_base64,
                    )

                    # Save to disk
                    filename = await save_image(image_bytes, settings.images_dir)

                    # Save to DB
                    gen_image = GeneratedImage(
                        task_id=task_id,
                        prompt=full_prompt,
                        provider=settings.ai_provider,
                        image_path=filename,
                        image_url=f"/static/images/{filename}",
                        gender=request.gender,
                        tpo=request.tpo,
                        height=request.height,
                        fit=request.fit,
                        category=build_category(request.tpo, i),
                    )
                    db.add(gen_image)
                    await db.commit()
                    generated_count += 1
                    logger.info(f"[Task {task_id}] Generated image {generated_count}/{num_images}")

                except Exception as e:
                    logger.error(f"[Task {task_id}] Failed to generate image {i+1}: {e}")
                    continue

            _task_status[task_id] = "completed" if generated_count > 0 else "failed"
            logger.info(f"[Task {task_id}] Done. Generated {generated_count}/{num_images} images.")

    except Exception as e:
        logger.error(f"[Task {task_id}] Task failed: {e}")
        _task_status[task_id] = "failed"


@router.post("/generate", response_model=GenerateResponse)
async def generate_styles(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
):
    """Start AI image generation. Returns a task_id to poll for results."""
    task_id = uuid.uuid4().hex[:16]

    # Validate API key before starting
    try:
        get_ai_provider()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    _task_status[task_id] = "processing"
    background_tasks.add_task(_generate_images_task, task_id, request)

    return GenerateResponse(
        task_id=task_id,
        status="processing",
        message="스타일 생성을 시작했습니다. task_id로 결과를 조회해주세요.",
    )


@router.get("/results/{task_id}", response_model=GenerationResultResponse)
async def get_results(task_id: str, db: AsyncSession = Depends(get_db)):
    """Poll generation results by task_id, including recommended catalog items."""
    status = _task_status.get(task_id, "unknown")

    result = await db.execute(
        select(GeneratedImage)
        .where(GeneratedImage.task_id == task_id)
        .order_by(GeneratedImage.id)
    )
    images = result.scalars().all()

    recommended_items: list[ClothingItem] = []

    if images:
        gender = images[0].gender
        categories = list(dict.fromkeys([img.category for img in images if img.category]))

        if categories:
            item_query = select(ClothingItem).where(ClothingItem.category.in_(categories))
            if gender:
                item_query = item_query.where(ClothingItem.gender == gender)
            item_result = await db.execute(item_query.order_by(ClothingItem.id).limit(12))
            recommended_items = item_result.scalars().all()

        # Fallback: if no category match, return recent items by gender
        if not recommended_items:
            fallback_query = select(ClothingItem)
            if gender:
                fallback_query = fallback_query.where(ClothingItem.gender == gender)
            fallback_result = await db.execute(fallback_query.order_by(ClothingItem.id.desc()).limit(12))
            recommended_items = fallback_result.scalars().all()

    return GenerationResultResponse(
        task_id=task_id,
        status=status,
        images=[
            GeneratedImageResponse(
                id=img.id,
                image_url=img.image_url,
                prompt=img.prompt,
                category=img.category,
                created_at=img.created_at,
            )
            for img in images
        ],
        total=len(images),
        recommended_items=[_to_item_response(item) for item in recommended_items],
    )
