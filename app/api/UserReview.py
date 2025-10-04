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
from app.models.UserReview import ReviewImage as ReviewImageModel
from app.schemas.Review import (
    ReviewImageOut,
    ReviewImageCreate,
    UserReviewCreate,
    UserReviewOut,
)
from pydantic import BaseModel

router = APIRouter(prefix="/Reviews", tags=["reviews"])

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
def get_all_reviews(db: Session = Depends(get_db)):
    """
    Return all reviews. Consider adding pagination in real app.
    """
    reviews = db.query(UserReviewModel).all()
    # Pydantic v2 conversion: UserReviewOut.model_validate(...) OR if model_config {"from_attributes": True} is set, direct conversion might work.
    # Use explicit conversion to be safe:
    out = [UserReviewOut.model_validate(r) for r in reviews]
    return out


@router.get("/ReviewStats/{speciesId}/{locationId}")
def get_review_stats(speciesId: str, locationId: str, db: Session = Depends(get_db)):
    """
    speciesId can be 'null' (string) to indicate no filter on species.
    locationId should be integer or 'null'.
    Returns: averageRating, totalReviews, ratingDistribution {5..1}
    """
    # parse path params
    sp_id: Optional[int] = None
    loc_id: Optional[int] = None
    if speciesId.lower() != "null":
        try:
            sp_id = int(speciesId)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid speciesId")
    if locationId.lower() != "null":
        try:
            loc_id = int(locationId)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid locationId")

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


@router.post("/ReviewImage", response_model=ReviewImageOut)
def upload_review_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a single review image and create DB record.
    Returns ReviewImageOut
    """
    # basic content type check (optional)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    saved = save_upload_file(file)
    # create DB record
    img = ReviewImageModel(
        id=saved["id"],
        reviewId="",  # no review yet; client should associate later OR you can accept reviewId as optional param
        url=saved["url"],
        thumbnailUrl=saved["thumbnailUrl"],
        originalName=saved["originalName"],
        uploadedAt=datetime.utcnow(),
        size=saved["size"],
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return ReviewImageOut.model_validate(img)


@router.post("/SubmitReview", response_model=ReviewResponse)
def submit_review(
    speciesId: int = Form(...),
    locationId: int = Form(...),
    rating: int = Form(..., ge=1, le=5),
    comment: str = Form(...),
    visitDate: Optional[str] = Form(None),
    userId: str = Form(...),
    userName: str = Form(...),
    userAvatar: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    timestamp: Optional[str] = Form(None),
    isVerified: Optional[bool] = Form(False),
    helpfulCount: Optional[int] = Form(0),
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
    # Parse visitDate với validation
    parsed_visit_date = None
    if visitDate and visitDate != 'string':  # Kiểm tra không phải placeholder
        try:
            parsed_visit_date = datetime.fromisoformat(visitDate)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid visitDate format. Expected ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS), got: {visitDate}"
            )
    
    # Parse timestamp với validation  
    parsed_timestamp = datetime.utcnow()  # Default to current time
    if timestamp:
        if isinstance(timestamp, str):
            try:
                parsed_timestamp = datetime.fromisoformat(timestamp)
            except ValueError:
                # Nếu không parse được, dùng thời gian hiện tại
                parsed_timestamp = datetime.utcnow()
        elif isinstance(timestamp, datetime):
            parsed_timestamp = timestamp

    review = UserReviewModel(
        id=review_id,
        speciesId=speciesId,
        locationId=locationId,
        userId=userId,
        userName=userName,
        userAvatar=userAvatar,
        rating=rating,
        comment=comment,
        timestamp=parsed_timestamp,
        isVerified=isVerified,
        helpfulCount=helpfulCount,
        visitDate=parsed_visit_date,
    )

    db.add(review)
    db.flush()  # ensure review.id is available for FK

    created_images = []
    if images:
        for up in images:
            if not up.content_type.startswith("image/"):
                # skip or raise; here we'll raise
                raise HTTPException(status_code=400, detail=f"Invalid image file: {up.filename}")
            saved = save_upload_file(up)
            img = ReviewImageModel(
                id=saved["id"],
                reviewId=review_id,
                url=saved["url"],
                thumbnailUrl=saved["thumbnailUrl"],
                originalName=saved["originalName"],
                uploadedAt=datetime.utcnow(),
                size=saved["size"],
            )
            db.add(img)
            created_images.append(img)

    db.commit()
    # refresh to load relationships
    db.refresh(review)
    for img in created_images:
        db.refresh(img)

    # Convert to schema
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
