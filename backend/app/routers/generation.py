"""
Generation Router handles style generation requests.
Supports AI generation and local outfit-combination fallback.
"""
import uuid
import logging
import os
import re
from collections import defaultdict

from fastapi import APIRouter, Depends, BackgroundTasks
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import ClothingItem, ClothingItemFeature, GeneratedImage
from app.schemas import (
    GenerateRequest,
    GenerateResponse,
    GeneratedImageResponse,
    GenerationResultResponse,
    ItemResponse,
    OutfitComboResponse,
)
from app.services.ai_service import build_category, build_prompt, get_ai_provider, save_image
from app.services.outfit_matcher import MatchCandidate, build_outfit_combinations

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["generation"])

# In-memory task status tracking
_task_status: dict[str, str] = {}


def _format_price(price: int) -> str:
    return f"{price:,}"


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


_ITEM_IDS_PATTERN = re.compile(r"item_ids:([0-9,]+)")


def _parse_item_ids_from_prompt(prompt: str) -> list[int]:
    match = _ITEM_IDS_PATTERN.search(prompt or "")
    if not match:
        return []
    raw = match.group(1)
    parsed: list[int] = []
    for token in raw.split(","):
        token = token.strip()
        if not token:
            continue
        try:
            parsed.append(int(token))
        except ValueError:
            continue
    return parsed


def _create_combo_collage(
    image_paths: list[str],
    images_dir: str,
    task_id: str,
    index: int,
) -> str | None:
    """Create a portrait 3:4 collage from outfit item images and return saved filename."""
    if not image_paths:
        return None

    # Match frontend card aspect ratio (3:4) to avoid aggressive object-cover cropping.
    canvas_w = 768
    canvas_h = 1024
    padding = 24
    gap = 18

    loaded: list[Image.Image] = []
    for relative in image_paths:
        path = os.path.join(images_dir, relative)
        if not os.path.exists(path):
            continue
        try:
            loaded.append(Image.open(path).convert("RGB"))
        except Exception:
            continue

    if not loaded:
        return None

    count = min(len(loaded), 3)
    slot_h = (canvas_h - (padding * 2) - (gap * (count - 1))) // count
    slot_w = canvas_w - (padding * 2)
    canvas = Image.new("RGB", (canvas_w, canvas_h), (245, 245, 245))

    y = padding
    for img in loaded[:count]:
        fitted = img.copy()
        fitted.thumbnail((slot_w, slot_h))
        off_x = padding + (slot_w - fitted.width) // 2
        off_y = y + (slot_h - fitted.height) // 2
        canvas.paste(fitted, (off_x, off_y))
        y += slot_h + gap

    filename = f"combo_{task_id}_{index}.png"
    canvas.save(os.path.join(images_dir, filename), format="PNG")
    return filename


async def _generate_images_task(task_id: str, request: GenerateRequest, num_images: int = 8):
    """Background task: generate AI images and save to DB."""
    settings = get_settings()
    provider = get_ai_provider()

    _task_status[task_id] = "processing"

    try:
        from app.database import async_session

        async with async_session() as db:
            generated_count = 0

            for i in range(num_images):
                try:
                    base_prompt = build_prompt(request.gender, request.tpo, request.height, request.fit)
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

                    image_bytes = await provider.generate_image(
                        prompt=full_prompt,
                        reference_image_b64=request.photo_base64,
                    )

                    filename = await save_image(image_bytes, settings.images_dir)

                    db.add(
                        GeneratedImage(
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
                    )
                    await db.commit()
                    generated_count += 1
                    logger.info("[Task %s] Generated image %s/%s", task_id, generated_count, num_images)

                except Exception as e:
                    logger.error("[Task %s] Failed to generate image %s: %s", task_id, i + 1, e)
                    continue

            _task_status[task_id] = "completed" if generated_count > 0 else "failed"
            logger.info("[Task %s] AI task done. Generated %s/%s images.", task_id, generated_count, num_images)

    except Exception as e:
        logger.error("[Task %s] AI task failed: %s", task_id, e)
        _task_status[task_id] = "failed"


async def _generate_local_outfit_task(task_id: str, request: GenerateRequest, limit: int = 8):
    """Background task: create pseudo-generation results from local outfit combinations."""
    _task_status[task_id] = "processing"
    settings = get_settings()

    try:
        from app.database import async_session

        async with async_session() as db:
            stmt = (
                select(ClothingItem, ClothingItemFeature)
                .join(ClothingItemFeature, ClothingItemFeature.item_id == ClothingItem.id)
            )
            if request.gender:
                stmt = stmt.where(ClothingItem.gender == request.gender)

            rows = (await db.execute(stmt.order_by(ClothingItem.id))).all()
            if not rows:
                _task_status[task_id] = "failed"
                return

            groups: dict[str, list[MatchCandidate]] = defaultdict(list)
            for item, feature in rows:
                groups[feature.item_type].append(MatchCandidate(item=item, feature=feature))

            combos = build_outfit_combinations(
                tpo=request.tpo,
                season=request.season,
                tops=groups.get("top", []),
                bottoms=groups.get("bottom", []),
                outers=groups.get("outer", []),
                onepieces=groups.get("onepiece", []),
                limit=limit,
            )

            created = 0
            seen_signatures: set[tuple[int, ...]] = set()
            for i, combo in enumerate(combos):
                combo_items = [candidate.item for candidate in combo.items if candidate.item.image_path]
                if not combo_items:
                    continue

                signature = tuple(sorted(item.id for item in combo_items))
                if signature in seen_signatures:
                    continue
                seen_signatures.add(signature)

                collage_filename = _create_combo_collage(
                    image_paths=[item.image_path for item in combo_items if item.image_path],
                    images_dir=settings.images_dir,
                    task_id=task_id,
                    index=i,
                )
                if collage_filename is None:
                    continue

                category = combo_items[0].category or build_category(request.tpo, i)
                names = ", ".join(item.name for item in combo_items)
                item_ids = ",".join(str(item.id) for item in combo_items)
                db.add(
                    GeneratedImage(
                        task_id=task_id,
                        prompt=f"LOCAL_COMBO: {combo.reason} | item_ids:{item_ids} | items: {names}",
                        provider="local",
                        image_path=collage_filename,
                        image_url=f"/static/images/{collage_filename}",
                        gender=request.gender,
                        tpo=request.tpo,
                        height=request.height,
                        fit=request.fit,
                        category=category,
                    )
                )
                created += 1

            await db.commit()
            _task_status[task_id] = "completed" if created > 0 else "failed"
            logger.info("[Task %s] Local task done. Created %s/%s results.", task_id, created, limit)

    except Exception as e:
        logger.error("[Task %s] Local task failed: %s", task_id, e)
        _task_status[task_id] = "failed"


@router.post("/generate", response_model=GenerateResponse)
async def generate_styles(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Start generation and return task_id for polling."""
    task_id = uuid.uuid4().hex[:16]
    settings = get_settings()
    _task_status[task_id] = "processing"

    if settings.ai_provider == "local":
        background_tasks.add_task(_generate_local_outfit_task, task_id, request)
        message = "Generating local outfit combinations."
    else:
        try:
            get_ai_provider()
            background_tasks.add_task(_generate_images_task, task_id, request)
            message = "Style generation started. Poll with task_id for progress."
        except ValueError:
            logger.warning("[Task %s] Missing AI key, falling back to local combinations.", task_id)
            background_tasks.add_task(_generate_local_outfit_task, task_id, request)
            message = "AI key missing; using local outfit combinations instead."

    return GenerateResponse(task_id=task_id, status="processing", message=message)


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
    outfit_combos: list[OutfitComboResponse] = []

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

        recommended_by_category: dict[str, list[ClothingItem]] = defaultdict(list)
        for item in recommended_items:
            if item.category:
                recommended_by_category[item.category].append(item)

        local_image_item_ids: dict[int, list[int]] = {}
        all_local_item_ids: set[int] = set()
        for image in images:
            if image.provider != "local":
                continue
            parsed_ids = _parse_item_ids_from_prompt(image.prompt)
            if not parsed_ids:
                continue
            local_image_item_ids[image.id] = parsed_ids
            all_local_item_ids.update(parsed_ids)

        local_item_map: dict[int, ClothingItem] = {}
        if all_local_item_ids:
            local_items_result = await db.execute(
                select(ClothingItem).where(ClothingItem.id.in_(all_local_item_ids))
            )
            local_item_map = {item.id: item for item in local_items_result.scalars().all()}

        for image in images:
            combo_items: list[ClothingItem] = []

            parsed_ids = local_image_item_ids.get(image.id, [])
            if parsed_ids:
                combo_items = [local_item_map[item_id] for item_id in parsed_ids if item_id in local_item_map]
            else:
                category_items = recommended_by_category.get(image.category or "", [])
                if category_items:
                    combo_items = category_items[:3]
                elif recommended_items:
                    combo_items = recommended_items[:3]

            if not combo_items:
                continue

            total_price = sum(item.price for item in combo_items)
            outfit_combos.append(
                OutfitComboResponse(
                    combo_id=f"combo-{task_id}-{image.id}",
                    image_id=image.id,
                    image_url=image.image_url,
                    category=image.category,
                    total_price=total_price,
                    total_price_display=_format_price(total_price),
                    items=[_to_item_response(item) for item in combo_items],
                )
            )

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
        outfit_combos=outfit_combos,
    )
