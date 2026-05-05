import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://aiplatform:aiplatform_secret@db:5432/aiplatform",
    )
    mistral_api_key: str = os.getenv("MISTRAL_API_KEY", "")
    mcp_server_url: str = os.getenv("MCP_SERVER_URL", "http://mcp-server:8001")

    class Config:
        env_file = ".env"


settings = Settings()
