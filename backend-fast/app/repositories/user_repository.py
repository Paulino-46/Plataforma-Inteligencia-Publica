from sqlalchemy.orm import Session
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    """Busca um utilizador pelo email."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Busca um utilizador pelo ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_all_users(db: Session) -> list[User]:
    """Retorna todos os utilizadores."""
    return db.query(User).all()


def create_user(
    db: Session,
    name: str,
    email: str,
    hashed_password: str,
    role: str = "GESTOR",
    organisation: str = "",
    country: str = "",
) -> User:
    """Cria um novo utilizador no banco de dados."""
    user = User(
        name=name,
        email=email,
        password=hashed_password,
        role=role,
        organisation=organisation,
        country=country,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: Session,
    user: User,
    name: str | None = None,
    email: str | None = None,
    hashed_password: str | None = None,
    role: str | None = None,
    organisation: str | None = None,
    country: str | None = None,
) -> User:
    """Actualiza os dados de um utilizador existente."""
    if name is not None:
        user.name = name
    if email is not None:
        user.email = email
    if hashed_password is not None:
        user.password = hashed_password
    if role is not None:
        user.role = role
    if organisation is not None:
        user.organisation = organisation
    if country is not None:
        user.country = country
    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user: User) -> User:
    """Desactiva um utilizador."""
    user.active = False
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    """Remove um utilizador do banco de dados."""
    db.delete(user)
    db.commit()
