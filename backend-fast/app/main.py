import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.dados import router as dados_router
from app.routers.mapa import router as mapa_router

from app.database import engine
from app.models.base import Base
from app.models.antena import Antena
from app.models.user import User
from app.models.assinantes import Assinante
from app.models.tensor_concentracao import TensorConcentracao
from app.models.tensor_fluxo_vias import TensorFluxoVias
from app.models.tensor_od import TensorOD
from app.models.tensor_tempo_deslocamento import TensorTempoDeslocamento
from app.models.trajetos_comuns import TrajetosComuns

from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session
from scripts.seed_data import seed_appbit_data

_APPBIT_SEED_LOCK_ID = 72610001

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas/verificadas com sucesso no banco de dados remoto.")
        with engine.connect() as connection:
            has_advisory_lock = engine.dialect.name == "postgresql"
            if has_advisory_lock:
                connection.execute(text("SELECT pg_advisory_lock(:lock_id)"), {"lock_id": _APPBIT_SEED_LOCK_ID})
                connection.commit()
            try:
                with Session(bind=connection) as session:
                    seed_appbit_data(session)
            finally:
                if has_advisory_lock:
                    connection.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": _APPBIT_SEED_LOCK_ID})
                    connection.commit()
    except Exception as e:
        print(f"Alerta: Não foi possível conectar ao banco de dados no startup: {e}")
        print("O servidor continuará rodando, mas requisições ao banco podem falhar.")
    yield

app = FastAPI(title="App BiT API", lifespan=lifespan)

# Permitir origens locais para desenvolvimento e domínios de produção
origins_env = os.environ.get("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

# Garantir origens padrão se nenhuma for providenciada
if not origins:
    origins = [
        "http://localhost:3000",
        "http://localhost:3003",
        "https://app-bit.surge.sh",
        "https://plataforma-inteligencia-publica.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(dados_router)
app.include_router(mapa_router)


@app.get("/")
def inicio():
    return {"mensagem": "Backend App BiT a funcionar!"}


@app.get("/health")
@app.get("/api")
def health_check():
    return {"status": "ok"}