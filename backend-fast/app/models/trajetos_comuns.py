from sqlalchemy import (
    Column, String, Integer, Float,
    PrimaryKeyConstraint,
)
from app.models.base import Base


class TrajetosComuns(Base):
    """
    ~500 linhas — pares OD k-anonimizados (K=3) para conformidade LGPD.
    Use em vez de tensor_od quando precisar de privacidade garantida.
    """
    __tablename__ = "trajetos_comuns"
    __table_args__ = (
        PrimaryKeyConstraint("cluster_origem", "cluster_destino"),
    )

    cluster_origem       = Column(String, nullable=False)
    municipio_origem     = Column(String)
    lat_origem           = Column(Float)
    lon_origem           = Column(Float)
    cluster_destino      = Column(String, nullable=False)
    municipio_destino    = Column(String)
    lat_destino          = Column(Float)
    lon_destino          = Column(Float)
    mesmo_cluster        = Column(Integer)
    n_usuarios           = Column(Integer)
    n_viagens            = Column(Integer)
    dist_media_km        = Column(Float)
    periodo_predominante = Column(String)