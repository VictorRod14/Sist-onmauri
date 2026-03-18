from fastapi import Header, HTTPException
from routes.auth import SESSIONS
from db.database import get_db
from models.user import User
from sqlalchemy.orm import Session
from fastapi import Depends


def require_roles(*allowed_roles):

    def checker(
        authorization: str = Header(None),
        db: Session = Depends(get_db),
    ):

        if not authorization:
            raise HTTPException(401, "Não autenticado")

        token = authorization.replace("Bearer ", "")

        if token not in SESSIONS:
            raise HTTPException(401, "Sessão inválida")

        user_id = SESSIONS[token]
        user = db.query(User).filter(User.id == user_id).first()

        if not user or user.role not in allowed_roles:
            raise HTTPException(403, "Sem permissão")

        return user

    return checker