"""
Location Service
Xử lý tất cả logic liên quan đến vị trí địa lý và thông tin khí hậu
"""

from typing import Optional
from pydantic import BaseModel

class LocationInfo(BaseModel):
    """Model để lưu thông tin về vị trí"""
    country: str
    city: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    coordinates: Optional[dict] = None
    climate_zone: Optional[str] = None
    timezone: Optional[str] = None

async def get_location_info(
    country: str,
    city: Optional[str] = None,
    district: Optional[str] = None,
    ward: Optional[str] = None
) -> LocationInfo:
    """
    Lấy thông tin chi tiết về vị trí
    Có thể tích hợp với các API như OpenWeatherMap, Google Maps, etc.
    """
    try:
        # Xác định timezone và climate zone dựa trên quốc gia/thành phố
        climate_zone = get_climate_zone(country, city)
        timezone = get_timezone(country, city)
        
        location_info = LocationInfo(
            country=country,
            city=city,
            district=district,
            ward=ward,
            climate_zone=climate_zone,
            timezone=timezone
        )
        
        # Có thể thêm logic để lấy coordinates từ geocoding API trong tương lai
        
        return location_info
        
    except Exception:
        # Fallback với thông tin cơ bản
        return LocationInfo(
            country=country,
            city=city,
            district=district,
            ward=ward,
            climate_zone="unknown",
            timezone="UTC+7"  # Default cho Vietnam
        )

def get_climate_zone(country: str, city: Optional[str] = None) -> str:
    """Xác định vùng khí hậu dựa trên quốc gia và thành phố"""
    climate_map = {
        "Vietnam": {
            "default": "tropical",
            "Da Lat": "temperate",
            "Sa Pa": "temperate", 
            "Hanoi": "subtropical",
            "Ho Chi Minh City": "tropical",
            "Hue": "tropical",
            "Da Nang": "tropical"
        },
        "Thailand": "tropical",
        "Singapore": "tropical",
        "Malaysia": "tropical",
        "Japan": "temperate",
        "Korea": "temperate",
        "China": "varies"  # Phụ thuộc vào region
    }
    
    if country in climate_map:
        if isinstance(climate_map[country], dict):
            return climate_map[country].get(city, climate_map[country]["default"])
        else:
            return climate_map[country]
    
    return "unknown"

def get_timezone(country: str, city: Optional[str] = None) -> str:
    """Xác định timezone dựa trên quốc gia và thành phố"""
    timezone_map = {
        "Vietnam": "UTC+7",
        "Thailand": "UTC+7", 
        "Singapore": "UTC+8",
        "Malaysia": "UTC+8",
        "Japan": "UTC+9",
        "Korea": "UTC+9",
        "China": "UTC+8"
    }
    
    return timezone_map.get(country, "UTC")

def get_seasonal_info(month: int) -> dict:
    """Lấy thông tin về mùa dựa trên tháng"""
    seasons = {
        "spring": [3, 4, 5],
        "summer": [6, 7, 8], 
        "autumn": [9, 10, 11],
        "winter": [12, 1, 2]
    }
    
    for season, months in seasons.items():
        if month in months:
            return {
                "season": season,
                "season_vietnamese": {
                    "spring": "mùa xuân",
                    "summer": "mùa hè", 
                    "autumn": "mùa thu",
                    "winter": "mùa đông"
                }[season]
            }
    
    return {"season": "unknown", "season_vietnamese": "không xác định"}