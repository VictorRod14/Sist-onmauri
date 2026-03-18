from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
import re

from db.database import get_db
from models.user import User
from core.security import verify_password, hash_password

router = APIRouter(tags=["Auth"])

# sessão simples em memória (ideal para sistema local)
SESSIONS = {}

# =====================================
# SCHEMA - TROCA DE SENHA
# =====================================
class ChangePasswordRequest(BaseModel):
    new_password: str


def _validate_password_rules(pw: str) -> str | None:
    if not pw or len(pw) < 6:
        return "A senha precisa ter no mínimo 6 caracteres."
    if not re.search(r"[A-Z]", pw):
        return "A senha precisa ter pelo menos 1 letra maiúscula."
    if not re.search(r"[a-z]", pw):
        return "A senha precisa ter pelo menos 1 letra minúscula."
    if not re.search(r"\d", pw):
        return "A senha precisa ter pelo menos 1 número."
    if not re.search(r"[^\w\s]", pw):
        return "A senha precisa ter pelo menos 1 caractere especial."
    return None


# =====================================
# LOGIN
# =====================================
@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(401, "Credenciais inválidas")

    if user.is_locked:
        raise HTTPException(403, "Usuário bloqueado")

    if not verify_password(password, user.password_hash):
        user.failed_attempts += 1

        if user.failed_attempts >= 3:
            user.is_locked = True

        db.commit()
        raise HTTPException(401, "Credenciais inválidas")

    # sucesso
    user.failed_attempts = 0
    db.commit()

    token = str(uuid.uuid4())
    SESSIONS[token] = user.id

    return {
        "token": token,
        "role": user.role,
        "must_change_password": user.must_change_password,
        "name": user.name,
        "email": user.email,
    }


# =====================================
# LOGOUT
# =====================================
@router.post("/logout")
def logout(authorization: str = Header(None)):

    if not authorization:
        return {"message": "Logout ok"}

    token = authorization.replace("Bearer ", "")

    if token in SESSIONS:
        del SESSIONS[token]

    return {"message": "Logout realizado"}


# =====================================
# TROCAR SENHA (PRIMEIRO LOGIN)
# =====================================
@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):

    if not authorization:
        raise HTTPException(status_code=401, detail="Token ausente")

    token = authorization.replace("Bearer ", "")

    if token not in SESSIONS:
        raise HTTPException(status_code=401, detail="Sessão inválida")

    user_id = SESSIONS[token]

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    pw = (data.new_password or "").strip()
    err = _validate_password_rules(pw)
    if err:
        raise HTTPException(status_code=400, detail=err)

    user.password_hash = hash_password(pw)
    user.must_change_password = False
    user.failed_attempts = 0

    db.commit()

    return {
        "message": "Senha alterada com sucesso",
        "role": user.role,
        "name": user.name,
        "email": user.email,
    }