from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from app.database import Base


class GeneratedImage(Base):
    """Stores metadata for AI-generated try-on images."""
    __tablename__ = "generated_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(64), index=True, nullable=False)
    prompt = Column(Text, nullable=False)
    provider = Column(String(20), nullable=False)  # "openai" or "gemini"
    image_path = Column(String(500), nullable=False)
    image_url = Column(String(500), nullable=True)
    gender = Column(String(10), nullable=True)
    tpo = Column(String(20), nullable=True)
    height = Column(Float, nullable=True)
    fit = Column(String(20), nullable=True)
    category = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class ClothingItem(Base):
    """Stores clothing item metadata for the store catalog."""
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)  # price in KRW
    category = Column(String(50), nullable=True)
    image_path = Column(String(500), nullable=True)
    stock_info = Column(String(200), nullable=True)  # e.g. "M(5), L(3)"
    location = Column(String(100), nullable=True)  # store location
    gender = Column(String(10), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
