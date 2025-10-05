from sqlalchemy import Column, Integer, String
from app.db.session import Base
from sqlalchemy.orm import relationship

class Specie(Base):
    __tablename__ = "species"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    speciesId = Column(Integer, unique=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    scientificName = Column(String, nullable=False)
    description = Column(String, nullable=True)
    imageUrl = Column(String, nullable=True)
    bloomTime = Column(String, nullable=True)
    color = Column(String, nullable=True)
    habitat = Column(String, nullable=True)
    characteristics = Column(String, nullable=True)
    
    locations = relationship("Location", back_populates="species", cascade="all, delete-orphan")
