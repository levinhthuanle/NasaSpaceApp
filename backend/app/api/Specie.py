from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.models.Specie import Specie
from app.schemas.Specie import SpecieCreate, SpecieOut, SpeciesDetailResponse, SpeciesListResponse

router = APIRouter(prefix="/species", tags=["species"])

@router.get("/all", response_model=SpeciesListResponse)
def get_all_species(db: Session = Depends(get_db)):
    species = db.query(Specie).all()
    return SpeciesListResponse(success=True, data=species)

@router.get("/{speciesId}", response_model=SpeciesDetailResponse)
def get_specie_by_id(speciesId: int, db: Session = Depends(get_db)):
    specie = db.query(Specie).filter(Specie.speciesId == speciesId).first()
    if not specie:
        raise HTTPException(status_code=404, detail="Specie not found")
    return SpeciesDetailResponse(success=True, data=specie)

@router.post("/", response_model=SpecieOut)
def create_specie(specie: SpecieCreate, db: Session = Depends(get_db)):
    db_specie = Specie(**specie.model_dump())
    db.add(db_specie)
    db.commit()
    db.refresh(db_specie)
    return db_specie
