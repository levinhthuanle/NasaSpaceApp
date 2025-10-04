from pydantic import BaseModel, Field

class SpecieBase(BaseModel):
    name: str
    scientificName: str
    description: str | None = None
    imageUrl: str | None = None
    bloomTime: str | None = None
    color: str | None = None
    habitat: str | None = None
    characteristics: str | None = None

class SpecieCreate(SpecieBase):
    speciesId: int


class SpecieOut(SpecieBase):
    id: int  # ID sẽ được tạo tự động
    speciesId: int
    
    class Config:
        from_attributes = True

class SpeciesListResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the request was successful")
    data: list[SpecieOut] = Field(..., description="List of species")
    message: str | None = Field(None, description="Optional message providing additional information")

class SpeciesDetailResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the request was successful")
    data: SpecieOut = Field(..., description="Detailed information about the species")
    message: str | None = Field(None, description="Optional message providing additional information")  