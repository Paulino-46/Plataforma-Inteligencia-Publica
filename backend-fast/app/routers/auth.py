from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import registar_utilizador, fazer_login, criar_token

router = APIRouter(prefix="/api")

# Formato dos dados que chegam do frontend
class DadosRegisto(BaseModel):
    name: str
    email: str
    password: str
    role: str = "GESTOR"
    organisation: str = ""
    country: str = ""

class DadosLogin(BaseModel):
    email: str
    password: str


@router.post("/auth/register")
def register(dados: DadosRegisto, db: Session = Depends(get_db)):
    utilizador = registar_utilizador(
        db, dados.name, dados.email, dados.password,
        role=dados.role, organisation=dados.organisation, country=dados.country
    )
    if utilizador is None:
        raise HTTPException(status_code=400, detail="Email já registado")
    return {
        "id": utilizador.id,
        "name": utilizador.name,
        "email": utilizador.email,
        "role": utilizador.role,
        "organisation": utilizador.organisation,
        "country": utilizador.country,
        "active": utilizador.active
    }


@router.post("/users/login")
def login(dados: DadosLogin, db: Session = Depends(get_db)):
    utilizador = fazer_login(db, dados.email, dados.password)

    if utilizador is None:
        raise HTTPException(status_code=401, detail="Email ou password incorretos")

    token = criar_token(utilizador.email)

    return {
        "token": token,
        "user": {
            "id": utilizador.id,
            "name": utilizador.name,
            "email": utilizador.email,
            "role": utilizador.role,
            "active": utilizador.active,
            "createdAt": utilizador.created_at.isoformat() if utilizador.created_at else None
        }
    }