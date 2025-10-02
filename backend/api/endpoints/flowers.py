"""
Flower API Endpoints
Tất cả các endpoints liên quan đến hoa và thực vật
"""

import datetime
from fastapi import APIRouter, HTTPException

from api.gemini import get_gemini_service, initialize_gemini
from services.location_service import get_location_info
from schemas.api_schemas import (
    FlowerLocationRequest,
    FlowerResponse, 
    ChatMessage,
    ChatResponse,
    CustomPromptRequest,
    CustomPromptResponse
)
from config.prompts import EXAMPLE_QUERIES

# Tạo router cho flower endpoints
router = APIRouter(prefix="/flowers", tags=["Flowers"])

@router.post("/location", response_model=FlowerResponse)
async def get_flowers_by_location(request: FlowerLocationRequest):
    """
    API chính để lấy thông tin hoa theo vị trí và thời gian
    
    Nhận thông tin vị trí, thời gian và các thông tin bổ sung,
    sau đó gửi lên Gemini API để lấy thông tin về các loài hoa phù hợp.
    """
    try:
        # Lấy Gemini service
        gemini_service = get_gemini_service()
        if not gemini_service.is_initialized:
            success, message = initialize_gemini()
            if not success:
                raise HTTPException(status_code=500, detail=message)
        
        # Lấy thông tin chi tiết về vị trí
        location_info = await get_location_info(
            country=request.country,
            city=request.city,
            district=request.district,
            ward=request.ward
        )
        
        # Chuẩn bị thời gian hiện tại
        current_time = request.current_time
        if not current_time:
            current_time = datetime.datetime.now().isoformat()
        
        # Gửi request tới Gemini
        response_text = gemini_service.get_flower_recommendations(
            country=request.country,
            city=request.city,
            district=request.district,
            ward=request.ward,
            current_time=current_time,
            season=request.season,
            climate_info=request.climate_info,
            additional_info=request.additional_info
        )
        
        # Chuẩn bị response
        response_data = {
            "gemini_response": response_text,
            "request_info": {
                "country": request.country,
                "city": request.city,
                "district": request.district,
                "ward": request.ward,
                "current_time": current_time,
                "season": request.season,
                "climate_info": request.climate_info,
                "additional_info": request.additional_info
            },
            "location_details": location_info.__dict__ if location_info else None
        }
        
        return FlowerResponse(
            success=True,
            data=response_data,
            message="Thông tin hoa đã được lấy thành công từ Gemini API",
            location={
                "country": request.country,
                "city": request.city,
                "full_address": f"{request.ward or ''}, {request.district or ''}, {request.city or ''}, {request.country}"
            },
            timestamp=datetime.datetime.now().isoformat()
        )
        
    except Exception as e:
        return FlowerResponse(
            success=False,
            data=None,
            message=f"Lỗi khi xử lý yêu cầu: {str(e)}",
            location=None,
            timestamp=datetime.datetime.now().isoformat()
        )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_flower_expert(message: ChatMessage):
    """
    API chat trực tiếp với chuyên gia hoa
    """
    try:
        # Lấy Gemini service
        gemini_service = get_gemini_service()
        if not gemini_service.is_initialized:
            success, msg = initialize_gemini()
            if not success:
                raise HTTPException(status_code=500, detail=msg)
        
        # Gửi message tới Gemini
        response_text = gemini_service.chat_with_expert(message.message)
        
        return ChatResponse(
            success=True,
            response=response_text,
            timestamp=datetime.datetime.now().isoformat()
        )
        
    except Exception as e:
        return ChatResponse(
            success=False,
            response=f"Lỗi xử lý chat: {str(e)}",
            timestamp=datetime.datetime.now().isoformat()
        )

@router.get("/examples")
async def get_example_queries():
    """
    Lấy danh sách các câu hỏi mẫu
    """
    return {
        "success": True,
        "examples": EXAMPLE_QUERIES,
        "timestamp": datetime.datetime.now().isoformat()
    }

@router.post("/custom", response_model=CustomPromptResponse)
async def custom_flower_query(request: CustomPromptRequest):
    """
    API cho custom prompt từ người dùng
    """
    try:
        custom_prompt = request.prompt
        if not custom_prompt:
            raise HTTPException(status_code=400, detail="Prompt không được để trống")
        
        # Lấy Gemini service  
        gemini_service = get_gemini_service()
        if not gemini_service.is_initialized:
            success, msg = initialize_gemini()
            if not success:
                raise HTTPException(status_code=500, detail=msg)
        
        # Generate content với custom prompt
        response_text = gemini_service.generate_content(custom_prompt)
        
        return CustomPromptResponse(
            success=True,
            response=response_text,
            prompt=custom_prompt,
            timestamp=datetime.datetime.now().isoformat()
        )
        
    except Exception as e:
        return CustomPromptResponse(
            success=False,
            response=f"Lỗi: {str(e)}",
            prompt=custom_prompt,
            timestamp=datetime.datetime.now().isoformat()
        )