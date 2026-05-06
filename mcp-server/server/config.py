from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """MCP Server configuration loaded from environment variables."""

    database_url: str = "postgresql+asyncpg://aiplatform:aiplatform_secret@db:5432/aiplatform"
    serpapi_api_key: str = ""
    mistral_api_key: str = ""

    @property
    def asyncpg_url(self) -> str:
        """Return a raw asyncpg connection URL (without SQLAlchemy prefix)."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql://")

    class Config:
        env_file = ".env"


settings = Settings()
