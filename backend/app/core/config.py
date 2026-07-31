import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Staff Scheduler API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database — build from individual parts so docker-compose env vars work correctly
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "postgres")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "scheduler")

    @property
    def DATABASE_URL(self) -> str:  # type: ignore[override]
        explicit = os.getenv("DATABASE_URL", "")
        if explicit:
            return explicit
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Redis & Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change_this_to_a_very_secret_key_in_production_32bytes_min")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://192.168.0.5",
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="allow")

settings = Settings()
