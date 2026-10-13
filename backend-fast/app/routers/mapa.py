import logging
import math

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import MapaResponse
from app.services.visent_service import VisentService
from app.services.auth_service import obter_utilizador_atual

router = APIRouter(prefix="/api/mapa", dependencies=[Depends(obter_utilizador_atual)])
logger = logging.getLogger(__name__)
INACOM_LOCATIONS_URL = (
    "https://observatoriotic.gov.ao/api/v1/mp/geolocation/location/states"
)


def _get_inacom_locations() -> tuple[list[dict], str | None]:
    try:
        response = httpx.get(
            INACOM_LOCATIONS_URL,
            params={"isActive": "false", "year": "null"},
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as error:
        logger.warning("Não foi possível carregar as localizações do INACOM: %s", error)
        return [], "Não foi possível carregar as referências geográficas do INACOM."

    locations = payload.get("object") if isinstance(payload, dict) else None
    if not isinstance(locations, list):
        logger.warning("A API geográfica do INACOM devolveu uma resposta inválida.")
        return [], "A API geográfica do INACOM devolveu uma resposta inválida."

    points = []
    seen_regions = set()
    for location in locations:
        if not isinstance(location, dict):
            continue

        name = location.get("name")
        latitude = location.get("latitude")
        longitude = location.get("longitude")
        if (
            not isinstance(name, str)
            or not name.strip()
            or location.get("country_name") != "Angola"
            or isinstance(latitude, bool)
            or not isinstance(latitude, (int, float))
            or not math.isfinite(latitude)
            or not -90 <= latitude <= 90
            or isinstance(longitude, bool)
            or not isinstance(longitude, (int, float))
            or not math.isfinite(longitude)
            or not -180 <= longitude <= 180
        ):
            continue

        region = name.strip()
        if region.casefold() in seen_regions:
            continue
        seen_regions.add(region.casefold())
        points.append({
            "regiao": region,
            "lat": latitude,
            "lng": longitude,
            "cobertura_rede": "Referência geográfica",
            "indicadores": {
                "capital": location.get("capital"),
                "fonte": "Observatório TIC / INACOM",
            },
            "fonte": "INACOM",
        })

    if not points:
        logger.warning("A API geográfica do INACOM não devolveu coordenadas angolanas válidas.")
        return [], "A API geográfica do INACOM não devolveu coordenadas válidas."

    return points, None

@router.get("", response_model=MapaResponse)
def obter_mapa(db: Session = Depends(get_db)):
    visent_service = VisentService(db)
    regioes = visent_service.get_mapa_regioes()
    inacom_locations, warning = _get_inacom_locations()
    return MapaResponse(
        regioes=[*regioes, *inacom_locations],
        avisos=[warning] if warning else [],
    )
