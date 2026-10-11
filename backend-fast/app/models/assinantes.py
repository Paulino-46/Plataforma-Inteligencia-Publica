from sqlalchemy import Column, String, Integer

from app.models.base import Base


class Assinante(Base):
    """Perfil demográfico sintético dos 200 mil assinantes."""
    __tablename__ = "assinantes"

    assinante_hash   = Column(Integer, primary_key=True)
    home_cluster     = Column(String, comment="Zona de residência habitual")
    home_municipio   = Column(String)
    income_cluster   = Column(String)
    age_group        = Column(String)
    mobility_pattern = Column(String)
    flag_flagship    = Column(Integer)