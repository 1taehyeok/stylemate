"""
AI Image Generation Service — Provider Abstraction Layer.
Supports OpenAI (gpt-image-1) and Google Gemini (gemini-2.5-flash).
"""
import os
import uuid
import base64
import logging
from abc import ABC, abstractmethod

from app.config import get_settings

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI image generation providers."""

    @abstractmethod
    async def generate_image(self, prompt: str, reference_image_b64: str | None = None) -> bytes:
        """Generate an image from a prompt. Returns raw image bytes (PNG)."""
        ...


class OpenAIProvider(AIProvider):
    """OpenAI gpt-image-1 provider."""

    def __init__(self, api_key: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate_image(self, prompt: str, reference_image_b64: str | None = None) -> bytes:
        logger.info(f"[OpenAI] Generating image with prompt: {prompt[:80]}...")

        kwargs = {
            "model": "gpt-image-1",
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024",
            "quality": "medium",
        }

        response = await self.client.images.generate(**kwargs)
        image_data = response.data[0]

        # gpt-image-1 returns base64 by default
        if hasattr(image_data, 'b64_json') and image_data.b64_json:
            return base64.b64decode(image_data.b64_json)

        # If URL is returned, download it
        if hasattr(image_data, 'url') and image_data.url:
            import httpx
            async with httpx.AsyncClient() as http_client:
                resp = await http_client.get(image_data.url)
                return resp.content

        raise ValueError("No image data in OpenAI response")


class GeminiProvider(AIProvider):
    """Google Gemini provider with image generation."""

    def __init__(self, api_key: str):
        from google import genai
        self.client = genai.Client(api_key=api_key)

    async def generate_image(self, prompt: str, reference_image_b64: str | None = None) -> bytes:
        logger.info(f"[Gemini] Generating image with prompt: {prompt[:80]}...")

        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_modalities": ["IMAGE", "TEXT"],
            }
        )

        # Extract image from response parts
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                return base64.b64decode(part.inline_data.data)

        raise ValueError("No image data in Gemini response")


def get_ai_provider() -> AIProvider:
    """Factory function — returns the configured AI provider."""
    settings = get_settings()

    if settings.ai_provider == "gemini":
        if not settings.gemini_api_key or settings.gemini_api_key.startswith("your-"):
            raise ValueError("GEMINI_API_KEY is not set in .env")
        return GeminiProvider(settings.gemini_api_key)
    else:
        if not settings.openai_api_key or settings.openai_api_key.startswith("sk-your"):
            raise ValueError("OPENAI_API_KEY is not set in .env")
        return OpenAIProvider(settings.openai_api_key)


def build_prompt(gender: str, tpo: str, height: float, fit: str | None) -> str:
    """Build a descriptive prompt for virtual try-on image generation."""
    gender_kr = "여성" if gender == "women" else "남성"
    tpo_map = {
        "daily": "데일리 캐주얼",
        "date": "데이트룩",
        "office": "오피스/비즈니스",
        "active": "액티브/스포티",
    }
    tpo_desc = tpo_map.get(tpo, "캐주얼")
    fit_desc = f", {fit} 핏" if fit else ""

    prompt = (
        f"A full-body fashion photo of a stylish Korean {gender_kr} model, "
        f"height approximately {height}cm{fit_desc}. "
        f"Wearing a modern {tpo_desc} outfit. "
        f"Clean white studio background, professional fashion photography, "
        f"high quality, natural lighting, full body shot from head to toe. "
        f"The outfit should be trendy, well-coordinated, and suitable for a {tpo_desc} occasion."
    )
    return prompt


def build_category(tpo: str, index: int) -> str:
    """Assign a display category based on TPO and item index."""
    categories = {
        "daily": "데일리룩",
        "date": "데이트룩",
        "office": "오피스룩",
        "active": "액티브룩",
    }
    base = categories.get(tpo, "추천순")
    if index < 4:
        return "추천순"
    return base


async def save_image(image_bytes: bytes, images_dir: str) -> str:
    """Save image bytes to disk. Returns the relative file path."""
    filename = f"{uuid.uuid4().hex}.png"
    filepath = os.path.join(images_dir, filename)
    os.makedirs(images_dir, exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return filename
