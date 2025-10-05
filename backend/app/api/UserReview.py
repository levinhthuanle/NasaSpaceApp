# app/api/UserReview.py
import os
import uuid
from datetime import datetime
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.UserReview import UserReview as UserReviewModel
from app.schemas.Review import (
    ReviewImageOut,
    ReviewImageCreate,
    UserReviewCreate,
    UserReviewOut,
)
from pydantic import BaseModel

router = APIRouter(prefix="/reviews", tags=["reviews"])

# upload directory (ensure exists)
UPLOAD_DIR = os.environ.get("REVIEWS_UPLOAD_DIR", "uploads/reviews")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Simple response schema for endpoints
class ReviewResponse(BaseModel):
    success: bool
    data: Optional[UserReviewOut] = None
    message: Optional[str] = None


# -----------------------
# Helpers
# -----------------------
def save_upload_file(file: UploadFile, upload_dir: str = UPLOAD_DIR) -> dict:
    """
    Save uploaded file to disk and return metadata dict:
    { id, url, thumbnailUrl, originalName, uploadedAt (ISO), size }
    Note: url/thumbnailUrl here are local paths; replace with real CDN URL in production.
    """
    ext = os.path.splitext(file.filename)[1]
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    dest_path = os.path.join(upload_dir, filename)
    with open(dest_path, "wb") as f:
        contents = file.file.read()
        f.write(contents)

    uploaded_at = datetime.utcnow().isoformat() + "Z"
    size = len(contents)
    # For demo we use file path as url. Replace with your public URL.
    url = f"/{upload_dir}/{filename}"
    thumbnail_url = url  # placeholder; generate thumbnail if you want

    return {
        "id": file_id,
        "url": url,
        "thumbnailUrl": thumbnail_url,
        "originalName": file.filename,
        "uploadedAt": uploaded_at,
        "size": size,
        "local_path": dest_path,
    }


# -----------------------
# Routes
# -----------------------

@router.get("/all", response_model=List[UserReviewOut])
def get_all_reviews(speciesId: int, locationId: int, db: Session = Depends(get_db)):
    """
    Return all reviews. Consider adding pagination in real app.
    """
    reviews = db.query(UserReviewModel).filter(
        UserReviewModel.speciesId == speciesId,
        UserReviewModel.locationId == locationId
    ).all()
    # Pydantic v2 conversion: UserReviewOut.model_validate(...) OR if model_config {"from_attributes": True} is set, direct conversion might work.
    # Use explicit conversion to be safe:
    out = [UserReviewOut.model_validate(r) for r in reviews]
    return out


@router.get("/stats")
def get_review_stats(speciesId: int, locationId: int, db: Session = Depends(get_db)):
    """
    speciesId can be 'null' (string) to indicate no filter on species.
    locationId should be integer or 'null'.
    Returns: averageRating, totalReviews, ratingDistribution {5..1}
    """
    # parse path params
    sp_id: Optional[int] = None
    loc_id: Optional[int] = None
    if speciesId is not None:
        sp_id = speciesId
    if locationId is not None:
        loc_id = locationId

    q = db.query(UserReviewModel).with_entities(
        func.avg(UserReviewModel.rating).label("avg_rating"),
        func.count(UserReviewModel.id).label("total"),
    )

    if sp_id is not None:
        q = q.filter(UserReviewModel.speciesId == sp_id)
    if loc_id is not None:
        q = q.filter(UserReviewModel.locationId == loc_id)

    stats_row = q.one()
    avg_rating = float(stats_row.avg_rating) if stats_row.avg_rating is not None else 0.0
    total_reviews = int(stats_row.total)

    # rating distribution
    dist_q = db.query(UserReviewModel.rating, func.count(UserReviewModel.id).label("count"))
    if sp_id is not None:
        dist_q = dist_q.filter(UserReviewModel.speciesId == sp_id)
    if loc_id is not None:
        dist_q = dist_q.filter(UserReviewModel.locationId == loc_id)
    dist_q = dist_q.group_by(UserReviewModel.rating)
    rows = dist_q.all()
    # build distribution dict for 5..1
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for rating, cnt in rows:
        # rating may be None / unexpected; guard
        try:
            r = int(rating)
            if r in distribution:
                distribution[r] = cnt
        except Exception:
            continue

    return {
        "averageRating": round(avg_rating, 2),
        "totalReviews": total_reviews,
        "ratingDistribution": distribution,
    }

@router.post("/submit", response_model=ReviewResponse)
def submit_review(
    speciesId: int = Form(...),
    locationId: int = Form(...),
    rating: int = Form(..., ge=1, le=5),
    comment: str = Form(...),
    userName: str = Form(...),
    images: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Submit a review. Accepts multipart/form-data:
    - form fields: speciesId, locationId, rating, comment, visitDate, userId, userName, userAvatar
    - files: images (multiple)
    """
    # validate species/location exist? (optional)
    # You may want to check species and location existence here.
    # Create review
    review_id = str(uuid.uuid4())


    review = UserReviewModel(
        id=review_id,
        speciesId=speciesId,
        locationId=locationId,
        userName=userName,
        rating=rating,
        comment=comment,
    )

    db.add(review)
    db.commit()
    review_out = UserReviewOut.model_validate(review)
    return ReviewResponse(success=True, data=review_out, message="Review submitted")


# -----------------------
# Optional: helper endpoint to get one review by id
# -----------------------
@router.get("/{review_id}", response_model=ReviewResponse)
def get_review_by_id(review_id: str, db: Session = Depends(get_db)):
    review = db.query(UserReviewModel).filter(UserReviewModel.id == review_id).first()
    if not review:
        return ReviewResponse(success=False, data=None, message="Review not found")
    return ReviewResponse(success=True, data=UserReviewOut.model_validate(review))
