from sqlalchemy import (
    Column, String, Integer, Float,
    PrimaryKeyConstraint,
)
from app.models.base import Base


class TensorTempoDeslocamento(Base):
    """~460 linhas — distâncias e tempos médios entre pares de clusters."""
    __tablename__ = "tensor_tempo_deslocamento"
    __table_args__ = (
        PrimaryKeyConstraint("cluster_origem", "cluster_destino"),
    )

    cluster_origem       = Column(String, nullable=False)
    cluster_destino      = Column(String, nullable=False)
    mesmo_cluster        = Column(Integer)
    n_observacoes        = Column(Integer)
    dist_media_km        = Column(Float)
    dist_p25_km          = Column(Float)
    dist_p75_km          = Column(Float)
    periodo_predominante = Column(String)