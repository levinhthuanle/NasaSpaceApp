"""
Health Check Endpoints
Các endpoints cho health monitoring
"""

import datetime
from fastapi import APIRouter

from schemas.api_schemas import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - Health check"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.datetime.now().isoformat(),
        version="1.0.0"
    )

@router.get("/health", response_model=HealthResponse) 
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.datetime.now().isoformat(),
        version="1.0.0"
    )