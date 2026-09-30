from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import MapaResponse
from app.services.visent_service import VisentService
from app.services.auth_service import obter_utilizador_atual

router = APIRouter(prefix="/api/mapa", dependencies=[Depends(obter_utilizador_atual)])

@router.get("", response_model=MapaResponse)
def obter_mapa(db: Session = Depends(get_db)):
    visent_service = VisentService(db)
    regioes = visent_service.get_mapa_regioes()
    return MapaResponse(regioes=regioes)
