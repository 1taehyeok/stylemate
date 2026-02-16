from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    ai_provider: str = "openai"  # "openai", "gemini", or "local"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Paths
    base_dir: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    images_dir: str = ""
    db_url: str = ""
    auto_create_tables: bool = False

    def model_post_init(self, __context):
        if not self.images_dir:
            self.images_dir = os.path.join(self.base_dir, "static", "images")
        if not self.db_url:
            self.db_url = f"sqlite+aiosqlite:///{os.path.join(self.base_dir, 'stylemate.db')}"
        os.makedirs(self.images_dir, exist_ok=True)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
