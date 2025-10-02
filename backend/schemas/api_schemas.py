"""
API Schemas - Định nghĩa các Pydantic schema cho API request/response
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class FlowerLocationRequest(BaseModel):
    """Request schema cho API lấy thông tin hoa theo vị trí"""
    country: str = Field(..., description="Tên quốc gia", example="Vietnam")
    city: Optional[str] = Field(None, description="Tên thành phố", example="Ho Chi Minh City")
    district: Optional[str] = Field(None, description="Tên quận/huyện", example="District 1")
    ward: Optional[str] = Field(None, description="Tên phường/xã", example="Ben Nghe Ward")
    current_time: Optional[str] = Field(None, description="Thời gian hiện tại (ISO format)", example="2025-10-01T10:00:00")
    additional_info: Optional[str] = Field(None, description="Thông tin bổ sung", example="Tìm hoa phù hợp cho mùa này")
    season: Optional[str] = Field(None, description="Mùa trong năm", example="spring")
    climate_info: Optional[str] = Field(None, description="Thông tin khí hậu", example="tropical")

class FlowerInfo(BaseModel):
    """Schema thông tin về một loài hoa"""
    name_vietnamese: str = Field(..., description="Tên tiếng Việt")
    name_scientific: str = Field(..., description="Tên khoa học")
    name_english: str = Field(..., description="Tên tiếng Anh")
    bloom_season: str = Field(..., description="Mùa nở")
    bloom_months: List[str] = Field(..., description="Tháng nở")
    characteristics: str = Field(..., description="Đặc điểm nổi bật")
    care_instructions: str = Field(..., description="Hướng dẫn chăm sóc")
    cultural_significance: str = Field(..., description="Ý nghĩa văn hóa")
    best_locations: List[str] = Field(..., description="Địa điểm thích hợp")
    colors: List[str] = Field(..., description="Màu sắc")
    suitable_for_location: str = Field(..., description="Có phù hợp với vị trí này không và tại sao")

class SeasonalInfo(BaseModel):
    """Schema thông tin mùa vụ"""
    current_season: str = Field(..., description="Mùa hiện tại")
    seasonal_characteristics: str = Field(..., description="Đặc điểm của mùa này")
    general_flower_care: str = Field(..., description="Chăm sóc hoa chung trong mùa này")

class FlowerRecommendation(BaseModel):
    """Schema khuyến nghị hoa hoàn chỉnh"""
    recommended_flowers: List[FlowerInfo] = Field(..., description="Danh sách hoa được khuyến nghị")
    seasonal_info: SeasonalInfo = Field(..., description="Thông tin mùa vụ")
    location_specific_advice: str = Field(..., description="Lời khuyên cụ thể cho vị trí")
    additional_tips: List[str] = Field(..., description="Mẹo bổ sung")

class FlowerResponse(BaseModel):
    """Response schema cho thông tin hoa"""
    success: bool
    data: Optional[Dict[str, Any]]
    message: str
    location: Optional[Dict[str, str]]
    timestamp: str

class ChatMessage(BaseModel):
    """Schema cho tin nhắn chat"""
    message: str = Field(..., description="Nội dung tin nhắn", min_length=1)

class ChatResponse(BaseModel):
    """Response schema cho chat"""
    success: bool
    response: str
    timestamp: str

class HealthResponse(BaseModel):
    """Health check response schema"""
    status: str
    timestamp: str
    version: str

class ErrorResponse(BaseModel):
    """Schema cho error response"""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    timestamp: str

class CustomPromptRequest(BaseModel):
    """Schema cho custom prompt request"""
    prompt: str = Field(..., description="Custom prompt", min_length=1)
    
class CustomPromptResponse(BaseModel):
    """Schema cho custom prompt response"""
    success: bool
    response: str
    prompt: str
    timestamp: str