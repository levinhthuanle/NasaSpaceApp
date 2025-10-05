from pydantic import BaseModel, Field
from typing import Optional, Dict


class LocationBase(BaseModel):
    locationName: str = Field(..., example="Ao sen Đồng Tháp")
    coordinates: list[float] = Field(
        ...,
        example=[10.123456, 105.123456],
        description="List containing latitude and longitude"
    )
    bloomingPeriod: Optional[Dict[str, str]] = Field(
        None,
        example={"start": "2025-05", 
                 "peak": "2025-07", 
                 "end": "2025-09"}
    )


class LocationCreate(LocationBase):
    speciesId: int = Field(..., example=1)


class LocationUpdate(BaseModel):
    locationName: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bloomingPeriod: Optional[Dict[str, str]] = None


class LocationOut(LocationBase):
    id: int
    speciesId: int

    model_config = {"from_attributes": True}
        
class LocationsResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the request was successful")
    data: list[LocationOut] = Field(..., description="List of locations")
    message: Optional[str] = Field(None, description="Optional message providing additional information")
    
    model_config = {"from_attributes": True}

