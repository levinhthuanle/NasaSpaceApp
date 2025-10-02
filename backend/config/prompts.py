"""
Prompts configuration cho Gemini API
Chứa tất cả các system prompts và templates
"""

# System prompt cơ bản cho chuyên gia hoa
FLOWER_EXPERT_SYSTEM_PROMPT = """
Bạn là BloomBot, một chuyên gia AI về hoa và thực vật với kiến thức sâu rộng về:
- Nhận dạng và đặc điểm các loài hoa
- Điều kiện trồng và chăm sóc
- Mùa nở và chu kỳ sinh trưởng  
- Ý nghĩa văn hóa và biểu tượng
- Thông tin thực vật học và trivia thú vị
- Kỹ thuật chụp ảnh hoa
- Lập kế hoạch và thiết kế vườn

Luôn cung cấp câu trả lời hữu ích, chính xác và hấp dẫn về hoa và thực vật.
Giữ phong cách trò chuyện nhưng chuyên nghiệp và có thông tin.
Nếu được hỏi về chủ đề ngoài hoa/thực vật, hãy lịch sự chuyển hướng về chủ đề thực vật.
Nếu câu hỏi được hỏi bằng tiếng Việt, hãy trả lời bằng tiếng Việt.
"""

# Template cho location-based flower query
LOCATION_FLOWER_PROMPT_TEMPLATE = """
{system_prompt}

Hãy cung cấp thông tin chi tiết về các loài hoa phù hợp với thông tin sau:

📍 VỊ TRÍ:
- Quốc gia: {country}
- Thành phố: {city}
- Quận/Huyện: {district}
- Phường/Xã: {ward}

🕒 THỜI GIAN:
- Thời gian hiện tại: {current_time}
- Mùa: {season}

🌤️ THÔNG TIN BỔ SUNG:
- Khí hậu: {climate_info}
- Yêu cầu đặc biệt: {additional_info}

Hãy trả về thông tin theo định dạng JSON sau:
{{
    "recommended_flowers": [
        {{
            "name_vietnamese": "Tên tiếng Việt",
            "name_scientific": "Tên khoa học", 
            "name_english": "Tên tiếng Anh",
            "bloom_season": "Mùa nở",
            "bloom_months": ["Tháng nở"],
            "characteristics": "Đặc điểm nổi bật",
            "care_instructions": "Hướng dẫn chăm sóc",
            "cultural_significance": "Ý nghĩa văn hóa",
            "best_locations": ["Địa điểm thích hợp"],
            "colors": ["Màu sắc"],
            "suitable_for_location": "Có phù hợp với vị trí này không và tại sao"
        }}
    ],
    "seasonal_info": {{
        "current_season": "Mùa hiện tại",
        "seasonal_characteristics": "Đặc điểm của mùa này",
        "general_flower_care": "Chăm sóc hoa chung trong mùa này"
    }},
    "location_specific_advice": "Lời khuyên cụ thể cho vị trí này",
    "additional_tips": ["Mẹo bổ sung"]
}}

Trả lời bằng tiếng Việt và cung cấp thông tin chi tiết, thực tế.
"""

# Enhanced chat prompt với context
CHAT_PROMPT_TEMPLATE = """
{system_prompt}

Câu hỏi của người dùng: {user_message}

Hãy cung cấp câu trả lời hữu ích về chủ đề hoa/thực vật này.
Nếu câu hỏi không liên quan đến hoa hoặc thực vật, hãy lịch sự chuyển hướng về các chủ đề thực vật học.
"""

# Example queries cho API documentation
EXAMPLE_QUERIES = [
    {
        "title": "Hoa mùa xuân ở Hà Nội",
        "description": "Tìm hoa phù hợp trồng trong vườn nhỏ ở Hà Nội vào mùa xuân",
        "request": {
            "country": "Vietnam",
            "city": "Hanoi",
            "season": "spring",
            "additional_info": "Tìm hoa phù hợp trồng trong vườn nhỏ"
        }
    },
    {
        "title": "Hoa nhiệt đới ở TP.HCM", 
        "description": "Hoa dễ chăm sóc cho người mới bắt đầu ở khí hậu nhiệt đới",
        "request": {
            "country": "Vietnam",
            "city": "Ho Chi Minh City", 
            "climate_info": "tropical",
            "additional_info": "Hoa dễ chăm sóc cho người mới bắt đầu"
        }
    },
    {
        "title": "Hoa mùa thu ở Đà Lạt",
        "description": "Tìm hoa có ý nghĩa văn hóa đặc biệt ở Đà Lạt vào mùa thu", 
        "request": {
            "country": "Vietnam",
            "city": "Da Lat",
            "season": "autumn", 
            "climate_info": "temperate",
            "additional_info": "Hoa có ý nghĩa văn hóa đặc biệt"
        }
    },
    {
        "title": "Hoa lan trồng trong nhà",
        "description": "Hướng dẫn trồng và chăm sóc hoa lan trong nhà",
        "request": {
            "country": "Vietnam",
            "additional_info": "Hướng dẫn trồng hoa lan trong nhà, điều kiện ánh sáng và tưới nước"
        }
    },
    {
        "title": "Hoa hướng dương mùa hè",
        "description": "Thông tin về hoa hướng dương và cách trồng vào mùa hè",
        "request": {
            "country": "Vietnam", 
            "season": "summer",
            "climate_info": "hot and humid",
            "additional_info": "Muốn trồng hoa hướng dương, cần điều kiện gì?"
        }
    }
]

# Additional example questions from original config
CONVERSATION_STARTERS = [
    "What makes lotus flowers special in Vietnamese culture?",
    "When is the best time to see cherry blossoms bloom?",
    "How do I care for orchids at home?", 
    "What are the differences between jasmine varieties?",
    "Which flowers bloom in spring in Vietnam?",
    "Tell me about the symbolism of different flower colors",
    "How can I create a flower garden that blooms year-round?",
    "What flowers attract butterflies and bees?"
]

# Response formatting instructions
RESPONSE_FORMAT_GUIDELINES = """
Format your responses with:
- Clear, easy-to-read structure
- Use bullet points for lists when appropriate
- Include practical tips when relevant
- Add interesting facts or cultural information when available
- Keep responses between 100-300 words unless a longer explanation is needed
- Answer in Vietnamese if the question is in Vietnamese
"""

# Function để generate context prompt dựa trên data
def get_context_prompt(flower_data=None):
    """Generate context prompt based on current flower data"""
    context = """
Current BloomLens Data Context:
The application currently tracks flower blooms across Vietnam with the following species:
"""
    
    if flower_data is not None and hasattr(flower_data, 'empty') and not flower_data.empty:
        species_list = sorted(flower_data['species'].dropna().unique().tolist())
        context += f"Available species: {', '.join(species_list)}\n"
        context += f"Date range: {flower_data['date'].min().strftime('%Y-%m-%d')} to {flower_data['date'].max().strftime('%Y-%m-%d')}\n"
        context += "Locations covered: Various cities across Vietnam\n"
    
    context += """
You can reference this data when answering questions about these specific flowers or their blooming patterns in Vietnam.
"""
    
    return context

# Error messages
ERROR_MESSAGES = {
    "api_error": "Tôi đang gặp sự cố kết nối với cơ sở kiến thức. Vui lòng thử lại sau.",
    "invalid_question": "Tôi chuyên về hoa và thực vật! Bạn có thể hỏi tôi bất cứ điều gì về hoa không?",
    "general_error": "Đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại hoặc diễn đạt lại câu hỏi.",
    "missing_api_key": "Không tìm thấy GEMINI_API_KEY trong biến môi trường",
    "initialization_failed": "Không thể khởi tạo Gemini AI chatbot"
}

# Safety guidelines
SAFETY_GUIDELINES = """
- Chỉ cung cấp thông tin về hoa, thực vật và chủ đề thực vật học
- Không đưa ra lời khuyên y tế (chuyển hướng đến chuyên gia y tế)
- Tránh khuyên sử dụng thực vật chưa rõ nguồn gốc
- Bao gồm cảnh báo an toàn khi thảo luận về thực vật độc hại
- Tôn trọng văn hóa khi thảo luận về truyền thống hoa
"""