from sqlalchemy import (
    Column, String, Integer, Float, Date, BigInteger,
    ForeignKeyConstraint, PrimaryKeyConstraint,
)
from app.models.base import Base


class TensorConcentracao(Base):
    """
    Concentração de pessoas por antena, dia e período.
    Chave de análise: mapa de calor de densidade populacional.
    """
    __tablename__ = "tensor_concentracao"
    __table_args__ = (
        PrimaryKeyConstraint("ecgi", "dia", "periodo"),
        ForeignKeyConstraint(["ecgi"], ["antenas.ecgi"]),
    )

    ecgi                   = Column(String, nullable=False)
    cluster                = Column(String)
    municipio              = Column(String)
    dia                    = Column("dia", Date, nullable=False)
    periodo                = Column(String, nullable=False,
                                    comment="MADRUGADA | MANHA | TARDE | NOITE")
    n_usuarios             = Column(Integer)
    n_sessoes              = Column(Integer)
    download_bytes         = Column(BigInteger)
    upload_bytes           = Column(BigInteger)
    dur_media_s            = Column(Float)
    drop_pct_medio         = Column(Float)
    congestionamento_medio = Column(Float)
    chamadas_total         = Column(Integer)
    mensagens_total        = Column(Integer)
    lat                    = Column(Float)
    lon                    = Column(Float)