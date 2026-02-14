"""Local outfit preview router (no AI calls required)."""
from collections import defaultdict
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ClothingItem, ClothingItemFeature
from app.schemas import OutfitPreviewItem, OutfitPreviewListResponse, OutfitPreviewResponse
from app.services.outfit_matcher import MatchCandidate, build_outfit_combinations

router = APIRouter(prefix="/api/outfits", tags=["outfit-preview"])


@router.get("/preview", response_model=OutfitPreviewListResponse)
async def preview_outfits(
    gender: str | None = None,
    tpo: str = "daily",
    season: str | None = None,
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ClothingItem, ClothingItemFeature)
        .join(ClothingItemFeature, ClothingItemFeature.item_id == ClothingItem.id)
    )
    if gender:
        stmt = stmt.where(ClothingItem.gender == gender)

    rows = (await db.execute(stmt.order_by(ClothingItem.id))).all()

    groups: dict[str, list[MatchCandidate]] = defaultdict(list)
    for item, feature in rows:
        groups[feature.item_type].append(MatchCandidate(item=item, feature=feature))

    matches = build_outfit_combinations(
        tpo=tpo,
        season=season,
        tops=groups.get("top", []),
        bottoms=groups.get("bottom", []),
        outers=groups.get("outer", []),
        onepieces=groups.get("onepiece", []),
        limit=limit,
    )

    combos = [
        OutfitPreviewResponse(
            score=m.score,
            reason=m.reason,
            items=[
                OutfitPreviewItem(
                    id=c.item.id,
                    name=c.item.name,
                    image_url=f"/static/images/{c.item.image_path}" if c.item.image_path else None,
                    item_type=c.feature.item_type,
                )
                for c in m.items
            ],
        )
        for m in matches
    ]

    return OutfitPreviewListResponse(total=len(combos), combos=combos)


@router.get("/preview-board", response_class=HTMLResponse)
async def preview_board(
    gender: str | None = None,
    tpo: str = "daily",
    season: str | None = None,
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
):
    payload = await preview_outfits(gender=gender, tpo=tpo, season=season, limit=limit, db=db)

    cards = []
    for combo in payload.combos:
        images = "".join(
            f'<div style="text-align:center"><img src="{item.image_url}" style="width:160px;height:200px;object-fit:cover;border-radius:8px;border:1px solid #ddd"/><div style="font-size:12px">{item.name}</div></div>'
            for item in combo.items if item.image_url
        )
        cards.append(
            f'<div style="border:1px solid #ddd;border-radius:12px;padding:12px;background:#fff">'
            f'<div style="font-weight:700">점수: {combo.score}</div>'
            f'<div style="font-size:12px;color:#666;margin-bottom:8px">{combo.reason}</div>'
            f'<div style="display:flex;gap:10px;flex-wrap:wrap">{images}</div>'
            f'</div>'
        )

    html = (
        "<html><head><meta charset='utf-8'><title>Outfit Preview Board</title></head>"
        "<body style='font-family:Arial;background:#f5f5f5;padding:20px'>"
        f"<h2>Outfit Preview Board (tpo={tpo}, gender={gender}, season={season})</h2>"
        "<p>AI API 호출 없이 DB의 의류/특징 데이터로 조합을 점검합니다.</p>"
        f"<div style='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px'>{''.join(cards)}</div>"
        "</body></html>"
    )
    return HTMLResponse(content=html)
