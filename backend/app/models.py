from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
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

    feature = relationship("ClothingItemFeature", back_populates="item", uselist=False, cascade="all, delete-orphan")


class ClothingItemFeature(Base):
    """Normalized feature table for local outfit matching without AI calls."""
    __tablename__ = "clothing_item_features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("clothing_items.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    item_type = Column(String(20), nullable=False)  # top, bottom, outer, onepiece
    color = Column(String(20), nullable=True)
    style = Column(String(20), nullable=True)  # casual, formal, sporty
    season = Column(String(20), nullable=True)  # spring, summer, fall, winter, all
    fit = Column(String(20), nullable=True)  # slim, regular, over
    formality = Column(Integer, nullable=True)  # 1-5
    warmth = Column(Integer, nullable=True)  # 1-5

    item = relationship("ClothingItem", back_populates="feature")


class AdminAuditLog(Base):
    """Stores admin access and mutation audit logs."""
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(50), nullable=False, index=True)  # admin_login, item_update
    success = Column(Boolean, nullable=False, default=False)
    admin_id = Column(String(100), nullable=True)
    session_token = Column(String(128), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(300), nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
