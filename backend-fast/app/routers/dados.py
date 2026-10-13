import asyncio
import logging
import math

import httpx
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    DadosRequest, DadosResponse,
    AssinantesStats, AntenasStats, ConcentracaoStats,
    FluxoViasStats, ODStats, TempoDeslocamentoStats, TrajetosComunsStats,
)
from app.services.visent_service import VisentService
from app.services.cohere_service import CohereService

from app.services.auth_service import obter_utilizador_atual

router = APIRouter(prefix="/api/dados", dependencies=[Depends(obter_utilizador_atual)])
logger = logging.getLogger(__name__)

OBSERVATORIO_API_URL = "https://observatoriotic.gov.ao/api/v1"
OBSERVATORIO_CHARTS = (
    {
        "id": "fixed-telephone",
        "marketplace": "Telefonia",
        "indicator": "Quotas de Subscrições de Telefonia Fixa",
        "title": "Telefonia fixa por operadora",
        "subtitle": "Subscrições de telefonia fixa",
    },
    {
        "id": "mobile-telephone",
        "marketplace": "Telefonia",
        "indicator": "Telefonia Móvel Celular",
        "title": "Subscrições de telefonia móvel",
        "subtitle": "Pré-pago e pós-pago",
    },
    {
        "id": "mobile-broadband",
        "marketplace": "Transferência de Dados",
        "indicator": "Banda Larga Móvel",
        "title": "Acesso à banda larga móvel",
        "subtitle": "Telemóveis com internet e outros dispositivos",
    },
    {
        "id": "television",
        "marketplace": "TV por Assinatura",
        "indicator": "Subscrições de TV Satelite & Cabo (Caoxial / FTTX)",
        "title": "Subscrições de televisão",
        "subtitle": "Cabo e satélite",
    },
    {
        "id": "sms-traffic",
        "marketplace": "Trafego",
        "indicator": "Tráfego de SMS",
        "title": "Tráfego de SMS",
        "subtitle": "Mensagens nacionais e internacionais",
    },
    {
        "id": "human-resources",
        "marketplace": "Recursos Humanos",
        "indicator": "Total de Colaboradores",
        "title": "Recursos humanos do sector",
        "subtitle": "Colaboradores por género",
    },
    {
        "id": "postal-services",
        "marketplace": "Serviços Postais",
        "indicator": "Volumes Postais",
        "title": "Volumes dos serviços postais",
        "subtitle": "Cartas e encomendas",
    },
)


async def _fetch_observatorio_json(
    client: httpx.AsyncClient, path: str
) -> dict | None:
    try:
        response = await client.get(path)
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as error:
        logger.warning("Falha ao consultar a API do Observatório TIC (%s): %s", path, error)
        return None

    return payload if isinstance(payload, dict) else None


async def _get_observatorio_charts() -> dict:
    timeout = httpx.Timeout(15.0)
    async with httpx.AsyncClient(
        base_url=OBSERVATORIO_API_URL,
        timeout=timeout,
    ) as client:
        marketplace_payload = await _fetch_observatorio_json(
            client, "/mp/marketplace/data/published"
        )
        marketplaces = (
            marketplace_payload.get("object")
            if marketplace_payload
            else None
        )
        if not isinstance(marketplaces, list):
            raise HTTPException(
                status_code=502,
                detail="Não foi possível obter as fontes publicadas pelo Observatório TIC.",
            )

        marketplace_ids = {
            item.get("name", "").strip().casefold(): item.get("id")
            for item in marketplaces
            if isinstance(item, dict)
            and isinstance(item.get("name"), str)
            and isinstance(item.get("id"), str)
        }
        required_marketplaces = {
            chart["marketplace"].casefold() for chart in OBSERVATORIO_CHARTS
        }
        sections_by_marketplace = {}
        warnings = []

        async def fetch_sections(name: str) -> tuple[str, list]:
            marketplace_id = marketplace_ids.get(name)
            if not marketplace_id:
                return name, []
            payload = await _fetch_observatorio_json(
                client, f"/mp/section/{marketplace_id}/published"
            )
            sections = payload.get("object") if payload else None
            return name, sections if isinstance(sections, list) else []

        section_results = await asyncio.gather(
            *(fetch_sections(name) for name in required_marketplaces)
        )
        sections_by_marketplace.update(section_results)

        indicators_to_fetch = []
        for chart in OBSERVATORIO_CHARTS:
            sections = sections_by_marketplace.get(
                chart["marketplace"].casefold(), []
            )
            indicator_name = chart["indicator"].casefold()
            indicator = next(
                (
                    section
                    for section in sections
                    if isinstance(section, dict)
                    and isinstance(section.get("name"), str)
                    and section["name"].strip().casefold() == indicator_name
                    and isinstance(section.get("id"), str)
                ),
                None,
            )
            if indicator is None:
                warnings.append(
                    f"O indicador «{chart['indicator']}» não está publicado no Observatório TIC."
                )
                continue
            indicators_to_fetch.append((chart, indicator["id"]))

        # Indicator values are queried in parallel, using the same published
        # period as the Observatório TIC data view.
        async def fetch_chart_data(chart: dict, indicator_id: str) -> tuple[dict, dict | None]:
            params = {
                "end_date": "2025-12",
                "start_date": "2021-01",
                "organism_id": "",
                "year": "2025",
                "region": "",
                "version": "",
            }
            try:
                response = await client.get(
                    f"/mp/indicator/{indicator_id}/published",
                    params=params,
                )
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError) as error:
                logger.warning(
                    "Falha ao carregar o indicador do Observatório TIC (%s): %s",
                    chart["indicator"],
                    error,
                )
                return chart, None
            return chart, payload if isinstance(payload, dict) else None

        results = await asyncio.gather(
            *(fetch_chart_data(chart, indicator_id) for chart, indicator_id in indicators_to_fetch)
        )

    charts = []
    for chart, payload in results:
        items = payload.get("object") if payload else None
        if not isinstance(items, list):
            warnings.append(f"Não foi possível carregar «{chart['title']}» do Observatório TIC.")
            continue

        data = [
            {"label": item["name"].strip(), "value": item["value"]}
            for item in items
            if isinstance(item, dict)
            and isinstance(item.get("name"), str)
            and item["name"].strip()
            and isinstance(item.get("value"), (int, float))
            and not isinstance(item.get("value"), bool)
            and math.isfinite(item["value"])
        ]
        if not data:
            warnings.append(f"Não há valores publicados para «{chart['title']}».")
            continue

        charts.append({
            "id": chart["id"],
            "title": chart["title"],
            "subtitle": chart["subtitle"],
            "data": data,
        })

    return {
        "charts": charts,
        "warnings": warnings,
        "source": "Observatório TIC / INACOM",
        "period": "2021–2025 (dados actualizados até 31/12/2025)",
    }

cohere_service = CohereService()

@router.post("", response_model=DadosResponse)
def consultar_dados(request: DadosRequest, db: Session = Depends(get_db)):
    visent_service = VisentService(db)
   
    filtros_dict = request.filtros.model_dump() if request.filtros else None
    documentos = visent_service.get_contexto_para_ia(
        consulta=request.consulta,
        filtros=filtros_dict
    )
    
    resultado = cohere_service.consultar(
        consulta=request.consulta,
        documentos=documentos,
        idioma=request.idioma or "pt"
    )
    
    return DadosResponse(
        resposta_ia=resultado["resposta_ia"],
        dados=resultado["dados"],
        fontes=resultado["fontes"]
    )


@router.get("/observatorio")
async def obter_dados_observatorio():
    return await _get_observatorio_charts()


@router.get("/assinantes", response_model=AssinantesStats)
def stats_assinantes(
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    return service.get_stats_assinantes(regiao)

@router.get("/antenas", response_model=AntenasStats)
def stats_antenas(
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    return service.get_stats_antenas(regiao)

@router.get("/tensor_concentracao", response_model=ConcentracaoStats)
def stats_concentracao(
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    return service.get_stats_concentracao(regiao)

@router.get("/tensor_fluxovias", response_model=FluxoViasStats)
def stats_fluxo_vias(
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    return service.get_stats_fluxo_vias(regiao)

@router.get("/tensorod", response_model=ODStats)
def stats_od(
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    return service.get_stats_od(regiao)

@router.get("/tempo_deslocamento", response_model=TempoDeslocamentoStats)
def stats_tempo_deslocamento(
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    return service.get_stats_tempo_deslocamento(regiao)

@router.get("/trajetos_comuns", response_model=TrajetosComunsStats)
def stats_trajetos_comuns(
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    return service.get_stats_trajetos_comuns(regiao)


@router.get("/cruzamento")
def cruzar_fontes_endpoint(
    fontes: str,
    regiao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = VisentService(db)
    lista_fontes = [f.strip() for f in fontes.split(",") if f.strip()]
    return service.cruzar_dados(lista_fontes, regiao)
