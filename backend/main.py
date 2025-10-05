
import os
from fastapi import FastAPI
from app.db.session import Base
import app.models
from sqlalchemy import create_engine
from app.core.config import settings
from contextlib import asynccontextmanager
from app.api import Location, Specie, UserReview
from fastapi.middleware.cors import CORSMiddleware

def run_migrations():
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("APP_ENV") != "test":
        run_migrations()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(Specie.router, prefix="/api/v1", tags=["species"])
app.include_router(Location.router, prefix="/api/v1", tags=["locations"])
app.include_router(UserReview.router, prefix="/api/v1", tags=["reviews"])