from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    database_url: str = "postgresql+asyncpg://aiplatform:aiplatform_secret@db:5432/aiplatform"
    mistral_api_key: str = ""
    mcp_server_url: str = "http://mcp-server:8001"

    class Config:
        env_file = ".env"


settings = Settings()
