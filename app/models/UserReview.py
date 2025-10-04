# app/models/user_review.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class UserReview(Base):
    __tablename__ = "user_reviews"

    id = Column(String, primary_key=True, index=True)  
    speciesId = Column(Integer, ForeignKey("species.speciesId", ondelete="CASCADE"), nullable=False)
    locationId = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    userName = Column(String, nullable=False)

    rating = Column(Integer, nullable=False)  
    comment = Column(String, nullable=False)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    images = Column(String, nullable=True) 
