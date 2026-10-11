from sqlalchemy import Column, String, Float

from app.models.base import Base


class Antena(Base):
    __tablename__ = "antenas"

    ecgi       = Column(String, primary_key=True,
                        comment="ID único da antena — SEMPRE STRING, nunca number")
    municipio  = Column(String)
    cluster    = Column(String, comment="Zona geográfica / bairro")
    lat        = Column(Float)
    lon        = Column(Float)
    tecnologia = Column(String, nullable=True, comment="3G | 4G | 5G")
    nome       = Column(String, nullable=True)