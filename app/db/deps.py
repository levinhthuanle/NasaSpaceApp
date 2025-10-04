
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings

def get_db():
    engine = create_engine(settings.DATABASE_URL)
    print("URL:---------------------------", settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
