# app/schemas/review.py
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field


# -------- ReviewImage schemas --------
class ReviewImageBase(BaseModel):
    url: str = Field(..., example="https://cdn.example.com/files/abcd.jpg")
    thumbnailUrl: str = Field(..., example="https://cdn.example.com/thumbs/abcd.jpg")
    originalName: str = Field(..., example="photo.jpg")
    uploadedAt: datetime = Field(..., example="2025-10-04T08:30:00Z", description="Datetime object")
    size: int = Field(..., example=123456, description="File size in bytes")

    model_config = {"extra": "ignore"}


class ReviewImageCreate(ReviewImageBase):
    id: Optional[str] = Field(None, description="Optional client-provided id (server may generate one)")


class ReviewImageOut(ReviewImageBase):
    id: str = Field(..., example="img_uuid_or_string")

    # allow ORM -> Pydantic conversion
    model_config = {"from_attributes": True, "extra": "ignore"}


# -------- UserReview schemas --------
class UserReviewBase(BaseModel):
    speciesId: int = Field(..., example=1)
    locationId: int = Field(..., example=10)
    userId: str = Field(..., example="user_abc123")
    userName: str = Field(..., example="Nguyen Van A")
    userAvatar: Optional[str] = Field(None, example="https://cdn.example.com/avatars/u.png")
    rating: int = Field(..., ge=1, le=5, example=5, description="Rating from 1 to 5")
    comment: str = Field(..., example="Beautiful place, lots of flowers.")
    images: Optional[List[ReviewImageCreate]] = Field(default_factory=list)
    timestamp: datetime = Field(..., example="2025-10-04T08:30:00Z", description="Datetime object")
    isVerified: bool = Field(False, description="Verified by admin/expert")
    helpfulCount: int = Field(0, description="Number of users who found this review helpful")
    visitDate: Optional[datetime] = Field(None, example="2025-07-21", description="Date or datetime object")

    model_config = {"extra": "ignore"}


class UserReviewCreate(UserReviewBase):
    id: Optional[str] = Field(None, description="Optional client-provided id; server may assign one")


class UserReviewUpdate(BaseModel):
    userName: Optional[str] = None
    userAvatar: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    images: Optional[List[ReviewImageCreate]] = None
    isVerified: Optional[bool] = None
    helpfulCount: Optional[int] = None
    visitDate: Optional[datetime] = None

    model_config = {"extra": "ignore"}


class UserReviewOut(UserReviewBase):
    id: str = Field(..., example="rev_uuid_or_string")
    images: List[ReviewImageOut] = Field(default_factory=list)

    # allow conversion from SQLAlchemy ORM objects
    model_config = {"from_attributes": True, "extra": "ignore"}
