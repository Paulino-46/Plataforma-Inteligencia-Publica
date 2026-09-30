

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine, DATABASE_URL
from app.models.base import Base


from app.models.antena import Antena  
from app.models.user import User
from app.models.assinantes import Assinante
from app.models.tensor_concentracao import TensorConcentracao
from app.models.tensor_fluxo_vias import TensorFluxoVias
from app.models.tensor_od import TensorOD
from app.models.tensor_tempo_deslocamento import TensorTempoDeslocamento
from app.models.trajetos_comuns import TrajetosComuns



from sqlalchemy import text

def run_migration():
    
    safe_url = DATABASE_URL
    if "@" in safe_url:
        prefix, suffix = safe_url.split("@", 1)
        safe_url = prefix.rsplit(":", 1)[0] + ":***@" + suffix

    print(f" Conectando a: {safe_url}")
    print(f" Tabelas a criar: {list(Base.metadata.tables.keys())}")

    # Drop existing sensor data tables to avoid type mismatches with old schemas (e.g. ecgi as bigint instead of varchar)
    tables_to_drop = [
        "tensor_concentracao", "tensor_fluxo_vias", "tensor_od",
        "tensor_tempo_deslocamento", "trajetos_comuns", "assinantes", "antenas"
    ]
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            print("🧹 Limpando tabelas antigas para evitar incompatibilidade de tipos...")
            for table in tables_to_drop:
                connection.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE;'))
            transaction.commit()
            print("✅ Tabelas antigas removidas com sucesso.")
        except Exception as e:
            transaction.rollback()
            print(f"⚠️ Erro ao remover tabelas antigas: {e}")

    Base.metadata.create_all(bind=engine)

    print(" Migração concluída com sucesso! Tabelas criadas/verificadas.")


if __name__ == "__main__":
    run_migration()
