import asyncio
from sqlalchemy import select, func
from app.database import async_session
from app.models import ClothingItem, GeneratedImage

async def main():
    async with async_session() as s:
        items = (await s.execute(select(func.count(ClothingItem.id)))).scalar_one()
        imgs  = (await s.execute(select(func.count(GeneratedImage.id)))).scalar_one()
        print("clothing_items_count =", items)
        print("generated_images_count =", imgs)

asyncio.run(main())
