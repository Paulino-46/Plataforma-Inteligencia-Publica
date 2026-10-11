from sqlalchemy import (
    Column, String, Integer, Float, Date,
    ForeignKeyConstraint, PrimaryKeyConstraint,
)
from app.models.base import Base

class TensorFluxoVias(Base):
    """
    Pares consecutivos de antenas com volume de usuários.
    Chave de análise: corredores urbanos e gargalos de mobilidade.
    """
    __tablename__ = "tensor_fluxo_vias"
    __table_args__ = (
        PrimaryKeyConstraint("ecgi_origem", "ecgi_destino"),
    )
 
    
    ecgi_origem       = Column(String, nullable=False,
                               comment="SEMPRE STRING — não converter para number")
    lat_origem        = Column(Float)
    lon_origem        = Column(Float)
    cluster_origem    = Column(String)
    municipio_origem  = Column(String)
 
    
    ecgi_destino      = Column(String, nullable=False,
                               comment="SEMPRE STRING — não converter para number")
    lat_destino       = Column(Float)
    lon_destino       = Column(Float)
    cluster_destino   = Column(String)
    municipio_destino = Column(String)
 
   
    n_usuarios            = Column(Integer)
    n_transicoes          = Column(Integer)
    dist_km               = Column(Float)
    periodo_predominante  = Column(String)
    pct_do_cluster_origem = Column(Float)