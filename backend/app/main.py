"""
StyleMate Backend — FastAPI Application Entry Point.
"""
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routers import generation, items
from app.routers import outfit_preview

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    settings = get_settings()
    logger.info("🚀 StyleMate Backend starting...")
    logger.info(f"   AI Provider: {settings.ai_provider}")
    logger.info(f"   Images Dir : {settings.images_dir}")

    # Optional fallback table creation (recommended: use Alembic migrations)
    if settings.auto_create_tables:
        await init_db()
        logger.info("   Database initialized with create_all.")
    else:
        logger.info("   Skipping create_all (run Alembic migrations instead).")

    # Ensure images directory exists
    os.makedirs(settings.images_dir, exist_ok=True)

    yield

    logger.info("👋 StyleMate Backend shutting down.")


app = FastAPI(
    title="StyleMate API",
    description="AI Virtual Try-On Kiosk Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving generated images
static_dir = os.path.join(settings.base_dir, "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include routers
app.include_router(generation.router)
app.include_router(items.router)
app.include_router(outfit_preview.router)


@app.get("/")
async def root():
    return {
        "service": "StyleMate API",
        "version": "1.0.0",
        "ai_provider": settings.ai_provider,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
