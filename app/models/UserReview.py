# app/models/user_review.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class UserReview(Base):
    __tablename__ = "user_reviews"

    id = Column(String, primary_key=True, index=True)   # UUID hoặc string id
    speciesId = Column(Integer, ForeignKey("species.speciesId", ondelete="CASCADE"), nullable=False)
    locationId = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    userId = Column(String, nullable=False)
    userName = Column(String, nullable=False)
    userAvatar = Column(String, nullable=True)

    rating = Column(Integer, nullable=False)  # 1–5
    comment = Column(String, nullable=False)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    isVerified = Column(Boolean, default=False, nullable=False)
    helpfulCount = Column(Integer, default=0, nullable=False)
    visitDate = Column(DateTime, nullable=True)

    images = relationship("ReviewImage", back_populates="review", cascade="all, delete-orphan")


class ReviewImage(Base):
    __tablename__ = "review_images"

    id = Column(String, primary_key=True, index=True)  # giữ dạng string (hoặc UUID)
    reviewId = Column(String, ForeignKey("user_reviews.id", ondelete="CASCADE"), nullable=False)

    url = Column(String, nullable=False)
    thumbnailUrl = Column(String, nullable=False)
    originalName = Column(String, nullable=False)
    uploadedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    size = Column(BigInteger, nullable=False)  # số bytes

    review = relationship("UserReview", back_populates="images")
