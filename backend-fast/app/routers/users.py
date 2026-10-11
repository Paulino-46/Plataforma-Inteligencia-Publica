from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import encriptar_password, registar_utilizador, obter_utilizador_atual
from app.repositories.user_repository import (
    get_all_users,
    get_user_by_id,
    update_user,
    deactivate_user,
    delete_user,
)

router = APIRouter(prefix="/api/users")


class UserRequest(BaseModel):
    email: str
    name: str
    password: str
    role: str = "GESTOR"
    organisation: str = ""
    country: str = ""


def _user_to_dict(user) -> dict:
    """Converte um User ORM para dicionário, omitindo a password."""
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "organisation": user.organisation,
        "country": user.country,
        "active": user.active,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("")
def criar_utilizador(dados: UserRequest, db: Session = Depends(get_db)):
    utilizador = registar_utilizador(
        db, dados.name, dados.email, dados.password,
        role=dados.role, organisation=dados.organisation, country=dados.country
    )
    if utilizador is None:
        raise HTTPException(status_code=400, detail="Email já registado")
    return _user_to_dict(utilizador)


@router.get("")
def listar_utilizadores(db: Session = Depends(get_db), current_user=Depends(obter_utilizador_atual)):
    users = get_all_users(db)
    return [_user_to_dict(u) for u in users]


@router.get("/{id}")
def ver_utilizador(id: int, db: Session = Depends(get_db), current_user=Depends(obter_utilizador_atual)):
    user = get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    return _user_to_dict(user)


@router.put("/{id}")
def actualizar_utilizador(id: int, dados: UserRequest, db: Session = Depends(get_db), current_user=Depends(obter_utilizador_atual)):
    user = get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    hashed_pw = encriptar_password(dados.password) if dados.password else None
    updated = update_user(
        db, user,
        name=dados.name,
        email=dados.email,
        hashed_password=hashed_pw,
        role=dados.role,
        organisation=dados.organisation,
        country=dados.country,
    )
    return _user_to_dict(updated)


@router.patch("/{id}/deactivate")
def desactivar_utilizador(id: int, db: Session = Depends(get_db), current_user=Depends(obter_utilizador_atual)):
    user = get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    deactivate_user(db, user)
    return {"mensagem": "Utilizador desactivado"}


@router.delete("/{id}")
def apagar_utilizador(id: int, db: Session = Depends(get_db), current_user=Depends(obter_utilizador_atual)):
    user = get_user_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    delete_user(db, user)
    return {"mensagem": "Utilizador apagado"}