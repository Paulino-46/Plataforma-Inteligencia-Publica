from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date


class CategoryDatum(BaseModel):
    label: str
    value: int


class FiltrosRequest(BaseModel):
    regiao:    Optional[str] = None
    indicador: Optional[str] = None  


class DadosRequest(BaseModel):
    consulta: str
    filtros:  Optional[FiltrosRequest] = None
    idioma:   Optional[str] = "pt"


class DadoRegiao(BaseModel):
    regiao: str
    valor:  Any
    fonte:  str

    model_config = {"from_attributes": True}


class DadosResponse(BaseModel):
    resposta_ia: str
    dados:       List[DadoRegiao]
    fontes:      List[str]




class RegiaoMapa(BaseModel):
    regiao:        str
    lat:           float
    lng:           float
    concentracao:  Optional[int]  = None
    cobertura_rede: Optional[str] = None
    indicadores:   Optional[dict] = None

    model_config = {"from_attributes": True}


class MapaResponse(BaseModel):
    regioes: List[RegiaoMapa]




class AntenaOut(BaseModel):
    ecgi:       str
    municipio:  Optional[str]   = None
    cluster:    Optional[str]   = None
    lat:        Optional[float] = None
    lon:        Optional[float] = None
    tecnologia: Optional[str]   = None

    model_config = {"from_attributes": True}



class ConcentracaoOut(BaseModel):
    ecgi:       str
    dia:        date
    periodo:    str
    n_usuarios: Optional[int] = None
    n_sessoes:  Optional[int] = None

    model_config = {"from_attributes": True}


class AssinantesStats(BaseModel):
    total: int
    por_idade: dict[str, int]
    por_renda: dict[str, int]
    por_mobilidade: dict[str, int]
    por_cluster: dict[str, int]
    por_municipio: dict[str, int]


class AntenasStats(BaseModel):
    total: int
    por_tecnologia: dict[str, int]
    por_municipio: dict[str, int]
    por_cluster: dict[str, int]


class ConcentracaoStats(BaseModel):
    total_usuarios: int
    total_sessoes: int
    total_download_gb: float
    total_upload_gb: float
    total_chamadas: int
    total_mensagens: int
    congestionamento_medio: Optional[float] = None
    drop_medio: Optional[float] = None
    por_cluster: dict[str, int]
    por_municipio: dict[str, int]
    por_periodo: dict[str, int]


class FluxoViasStats(BaseModel):
    total_usuarios: int
    total_transicoes: int
    dist_media_km: Optional[float] = None
    por_periodo: dict[str, int]
    por_cluster_origem: dict[str, int]
    por_cluster_destino: dict[str, int]
    top_fluxos: list[CategoryDatum] = []


class ODStats(BaseModel):
    total_usuarios: int
    total_viagens: int
    dist_media_km: Optional[float] = None
    total_mesmo_cluster: int
    total_diferente_cluster: int
    por_periodo: dict[str, int]
    por_cluster_origem: dict[str, int]
    por_cluster_destino: dict[str, int]


class TempoDeslocamentoStats(BaseModel):
    total_observacoes: int
    dist_media_km: Optional[float] = None
    dist_p25_km: Optional[float] = None
    dist_p75_km: Optional[float] = None
    por_periodo: dict[str, int]
    por_cluster_origem: dict[str, int]
    por_cluster_destino: dict[str, int]


class TrajetosComunsStats(BaseModel):
    total_usuarios: int
    total_viagens: int
    dist_media_km: Optional[float] = None
    por_periodo: dict[str, int]
    por_cluster_origem: dict[str, int]
    por_cluster_destino: dict[str, int]