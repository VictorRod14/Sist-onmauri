from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
from routes.auth import SESSIONS


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):

    if not authorization:
        raise HTTPException(401, "Não autenticado")

    token = authorization.replace("Bearer ", "")

    user_id = SESSIONS.get(token)

    if not user_id:
        raise HTTPException(401, "Sessão inválida")

    user = db.query(User).get(user_id)

    return user


def require_roles(*roles):
    def checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(403, "Sem permissão")
        return user
    return checker