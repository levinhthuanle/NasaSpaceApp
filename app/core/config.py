# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    SECRET_KEY: str = "change_this_in_production"
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/postgres"

    BACKEND_PORT: int = 8000
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    model_config = ConfigDict(env_file=".env", extra="ignore")

settings = Settings()