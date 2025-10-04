from sqlalchemy import Column, Float, ForeignKey, Integer, String
from app.db.session import Base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Tham chiếu đến species
    speciesId = Column(Integer, ForeignKey("species.speciesId"), nullable=False)

    locationName = Column(String, nullable=False)

    # Tọa độ tách riêng
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Blooming period lưu JSON {"start": "...", "peak": "...", "end": "..."}
    bloomingPeriod = Column(JSONB, nullable=True)

    species = relationship("Specie", back_populates="locations")