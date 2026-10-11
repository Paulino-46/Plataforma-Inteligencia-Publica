from typing import Optional

from fastapi import APIRouter, Depends
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

