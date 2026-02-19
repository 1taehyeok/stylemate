import asyncio
from sqlalchemy import select
from app.database import async_session, init_db
from app.models import GeneratedImage

async def main():
    await init_db()
    async with async_session() as s:
        task_id = "task_pr2_demo"
        res = await s.execute(select(GeneratedImage).where(GeneratedImage.task_id == task_id))
        if res.scalars().first() is None:
            s.add(GeneratedImage(
                task_id=task_id,
                prompt="demo prompt",
                provider="openai",
                image_path="demo.png",
                image_url="/static/images/demo.png",
                gender="women",
                tpo="office",
                height=165,
                fit="정핏",
                category="office",
            ))
            await s.commit()
            print("Inserted demo GeneratedImage:", task_id)
        else:
            print("Already exists:", task_id)

asyncio.run(main())
