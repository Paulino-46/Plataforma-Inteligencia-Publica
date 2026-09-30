from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    PrimaryKeyConstraint,
)
from app.models.base import Base


class TensorOD(Base):
    """
    pares Origem-Destino agregados entre clusters.
    Chave de análise: fluxo entre bairros/zonas.
    """
    __tablename__ = "tensor_od"
    __table_args__ = (
        PrimaryKeyConstraint("cluster_origem", "cluster_destino"),
    )

    cluster_origem      = Column(String, nullable=False)
    municipio_origem    = Column(String)
    lat_origem          = Column(Float)
    lon_origem          = Column(Float)
    cluster_destino     = Column(String, nullable=False)
    municipio_destino   = Column(String)
    lat_destino         = Column(Float)
    lon_destino         = Column(Float)
    mesmo_cluster       = Column(Integer)
    n_usuarios          = Column(Integer)
    n_viagens           = Column(Integer)
    dist_media_km       = Column(Float)
    periodo_predominante = Column(String)