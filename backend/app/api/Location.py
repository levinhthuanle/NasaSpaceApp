from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.models.Location import Location
from app.schemas.Location import LocationCreate, LocationOut, LocationsResponse

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/all", response_model=LocationsResponse)
def get_all_locations(db: Session = Depends(get_db)):
    data = db.query(Location).all()
    locations = []
    for loc in data:
        locations.append({
            "id": loc.id,
            "speciesId": loc.speciesId,
            "locationName": loc.locationName,
            "coordinates": [loc.latitude, loc.longitude],
            "bloomingPeriod": loc.bloomingPeriod
        })
    return LocationsResponse(success=True, data=locations)

@router.get("/{speciesId}", response_model=LocationsResponse)
def get_locations_by_species_id(speciesId: int, db: Session = Depends(get_db)):
    locations = db.query(Location).filter(Location.speciesId == speciesId).all()
    if not locations:
        raise HTTPException(status_code=404, detail="No locations found for the given speciesId")
    #     peak: string
    #     end: string
    # }
    return LocationsResponse(success=True, data=locations)

@router.get("/{speciesId}", response_model=LocationsResponse)
def get_locations_by_species_id(speciesId: int, db: Session = Depends(get_db)):
    locations = db.query(Location).filter(Location.speciesId == speciesId).all()
    if not locations:
        raise HTTPException(status_code=404, detail="No locations found for the given speciesId")
    return LocationsResponse(success=True, locations=locations)

@router.post("/", response_model=LocationOut)
def create_location(location: LocationCreate, db: Session = Depends(get_db)):
    db_location = Location(
        speciesId=location.speciesId,
        locationName=location.locationName,
        latitude=location.coordinates[0],
        longitude=location.coordinates[1],
        bloomingPeriod=location.bloomingPeriod
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    # convert to LocationOut format
    db_location.coordinates = [db_location.latitude, db_location.longitude]
    return db_location