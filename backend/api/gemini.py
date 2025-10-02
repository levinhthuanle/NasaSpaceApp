"""
Gemini API Service
Xử lý tất cả các tương tác với Google Gemini AI
"""

import os
import google.generativeai as genai
from typing import Optional, Tuple
from datetime import datetime

from config.prompts import (
    FLOWER_EXPERT_SYSTEM_PROMPT,
    LOCATION_FLOWER_PROMPT_TEMPLATE,
    CHAT_PROMPT_TEMPLATE,
    ERROR_MESSAGES
)

class GeminiService:
    """Service để tương tác với Gemini AI"""
    
    def __init__(self):
        self.model = None
        self.is_initialized = False
        
    def initialize(self, api_key: Optional[str] = None) -> Tuple[bool, str]:
        """
        Khởi tạo Gemini API client
        
        Args:
            api_key: API key cho Gemini. Nếu None, sẽ lấy từ environment variables
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        try:
            # Lấy API key từ parameter hoặc environment
            if api_key:
                genai.configure(api_key=api_key)
            elif "GEMINI_API_KEY" in os.environ:
                genai.configure(api_key=os.environ["GEMINI_API_KEY"])
            else:
                return False, ERROR_MESSAGES["missing_api_key"]
            
            # Khởi tạo model
            self.model = genai.GenerativeModel(
                model_name="gemini-2.0-flash-exp",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                }
            )
            
            self.is_initialized = True
            return True, "Gemini AI initialized successfully!"
            
        except Exception as e:
            return False, f"Failed to initialize Gemini AI: {str(e)}"
    
    def get_flower_recommendations(
        self,
        country: str,
        city: Optional[str] = None,
        district: Optional[str] = None, 
        ward: Optional[str] = None,
        current_time: Optional[str] = None,
        season: Optional[str] = None,
        climate_info: Optional[str] = None,
        additional_info: Optional[str] = None
    ) -> str:
        """
        Lấy gợi ý hoa dựa trên vị trí và thời gian
        
        Args:
            country: Tên quốc gia
            city: Tên thành phố
            district: Tên quận/huyện
            ward: Tên phường/xã
            current_time: Thời gian hiện tại
            season: Mùa trong năm
            climate_info: Thông tin khí hậu
            additional_info: Thông tin bổ sung
            
        Returns:
            str: Response từ Gemini AI
        """
        if not self.is_initialized:
            return ERROR_MESSAGES["initialization_failed"]
        
        try:
            # Chuẩn bị thời gian nếu chưa có
            if not current_time:
                current_time = datetime.now().isoformat()
            
            # Format prompt với thông tin được cung cấp
            prompt = LOCATION_FLOWER_PROMPT_TEMPLATE.format(
                system_prompt=FLOWER_EXPERT_SYSTEM_PROMPT,
                country=country,
                city=city or 'Không xác định',
                district=district or 'Không xác định', 
                ward=ward or 'Không xác định',
                current_time=current_time,
                season=season or 'Không xác định',
                climate_info=climate_info or 'Không xác định',
                additional_info=additional_info or 'Không có'
            )
            
            # Gửi request tới Gemini
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"{ERROR_MESSAGES['api_error']} Chi tiết lỗi: {str(e)}"
    
    def chat_with_expert(self, user_message: str) -> str:
        """
        Chat trực tiếp với chuyên gia hoa AI
        
        Args:
            user_message: Tin nhắn từ người dùng
            
        Returns:
            str: Response từ Gemini AI
        """
        if not self.is_initialized:
            return ERROR_MESSAGES["initialization_failed"]
        
        try:
            # Format prompt cho chat
            prompt = CHAT_PROMPT_TEMPLATE.format(
                system_prompt=FLOWER_EXPERT_SYSTEM_PROMPT,
                user_message=user_message
            )
            
            # Gửi request tới Gemini
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"{ERROR_MESSAGES['api_error']} Chi tiết lỗi: {str(e)}"
    
    def generate_content(self, prompt: str) -> str:
        """
        Phương thức chung để generate content với prompt tùy chỉnh
        
        Args:
            prompt: Custom prompt
            
        Returns:
            str: Response từ Gemini AI
        """
        if not self.is_initialized:
            return ERROR_MESSAGES["initialization_failed"]
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"{ERROR_MESSAGES['api_error']} Chi tiết lỗi: {str(e)}"

# Global service instance
_gemini_service = None

def get_gemini_service() -> GeminiService:
    """
    Singleton pattern để lấy instance của GeminiService
    
    Returns:
        GeminiService: Instance của service
    """
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

def initialize_gemini(api_key: Optional[str] = None) -> Tuple[bool, str]:
    """
    Helper function để khởi tạo Gemini service
    
    Args:
        api_key: Optional API key
        
    Returns:
        Tuple[bool, str]: (success, message)
    """
    service = get_gemini_service()
    return service.initialize(api_key)