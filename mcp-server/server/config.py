import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """MCP Server configuration loaded from environment variables."""

    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://aiplatform:aiplatform_secret@db:5432/aiplatform",
    )
    serpapi_api_key: str = os.getenv("SERPAPI_API_KEY", "")
    mistral_api_key: str = os.getenv("MISTRAL_API_KEY", "")

    # Convert asyncpg URL to raw asyncpg format for direct connections
    @property
    def asyncpg_url(self) -> str:
        """Return a raw asyncpg connection URL (without SQLAlchemy prefix)."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql://")

    class Config:
        env_file = ".env"


settings = Settings()
