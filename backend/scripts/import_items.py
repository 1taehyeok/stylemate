"""Import or update clothing catalog items from a CSV file.

Usage:
  python scripts/import_items.py --csv data/sample_items.csv
"""

from __future__ import annotations

import argparse
import asyncio
import csv
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import select

from app.database import async_session
from app.models import ClothingItem, ClothingItemFeature


REQUIRED_COLUMNS = {"name", "price", "category", "gender", "stock_info", "location"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import clothing items CSV into DB")
    parser.add_argument("--csv", required=True, help="Path to CSV file")
    return parser.parse_args()


def validate_row(row: dict[str, str], row_number: int) -> tuple[bool, str | None]:
    missing = [key for key in REQUIRED_COLUMNS if not row.get(key)]
    if missing:
        return False, f"row {row_number}: missing required fields: {', '.join(missing)}"

    try:
        price = int(row["price"])
        if price < 0:
            return False, f"row {row_number}: price cannot be negative"
    except ValueError:
        return False, f"row {row_number}: invalid integer price '{row['price']}'"

    return True, None


def infer_feature_defaults(category: str) -> dict[str, str | int]:
    if category == "office":
        return {"item_type": "top", "style": "formal", "season": "all", "formality": 5, "warmth": 3}
    if category == "active":
        return {"item_type": "bottom", "style": "sporty", "season": "all", "formality": 1, "warmth": 2}
    if category == "date":
        return {"item_type": "onepiece", "style": "casual", "season": "spring", "formality": 3, "warmth": 2}
    return {"item_type": "top", "style": "casual", "season": "all", "formality": 2, "warmth": 2}


async def upsert_items(csv_path: Path) -> None:
    created = 0
    updated = 0
    skipped = 0

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = set(reader.fieldnames or [])
        missing_headers = REQUIRED_COLUMNS - headers
        if missing_headers:
            raise ValueError(f"CSV missing required headers: {', '.join(sorted(missing_headers))}")

        async with async_session() as db:
            for i, row in enumerate(reader, start=2):
                valid, reason = validate_row(row, i)
                if not valid:
                    print(f"[SKIP] {reason}")
                    skipped += 1
                    continue

                stmt = select(ClothingItem).where(
                    ClothingItem.name == row["name"],
                    ClothingItem.gender == row["gender"],
                    ClothingItem.category == row["category"],
                )
                result = await db.execute(stmt)
                item = result.scalar_one_or_none()

                payload = {
                    "description": row.get("description") or None,
                    "price": int(row["price"]),
                    "image_path": row.get("image_path") or None,
                    "stock_info": row.get("stock_info") or None,
                    "location": row.get("location") or None,
                }

                if item is None:
                    item = ClothingItem(
                        name=row["name"],
                        category=row["category"],
                        gender=row["gender"],
                        **payload,
                    )
                    db.add(item)
                    await db.flush()
                    created += 1
                else:
                    for key, value in payload.items():
                        setattr(item, key, value)
                    updated += 1

                feature_defaults = infer_feature_defaults(row["category"])
                feat_stmt = select(ClothingItemFeature).where(ClothingItemFeature.item_id == item.id)
                feat_result = await db.execute(feat_stmt)
                feature = feat_result.scalar_one_or_none()

                feature_payload = {
                    "item_type": row.get("item_type") or feature_defaults["item_type"],
                    "color": row.get("color") or None,
                    "style": row.get("style") or feature_defaults["style"],
                    "season": row.get("season") or feature_defaults["season"],
                    "fit": row.get("fit") or None,
                    "formality": int(row["formality"]) if row.get("formality") else feature_defaults["formality"],
                    "warmth": int(row["warmth"]) if row.get("warmth") else feature_defaults["warmth"],
                }

                if feature is None:
                    db.add(ClothingItemFeature(item_id=item.id, **feature_payload))
                else:
                    for key, value in feature_payload.items():
                        setattr(feature, key, value)

            await db.commit()

    print(f"Import complete. created={created}, updated={updated}, skipped={skipped}")


def main() -> None:
    args = parse_args()
    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    asyncio.run(upsert_items(csv_path))


if __name__ == "__main__":
    main()
