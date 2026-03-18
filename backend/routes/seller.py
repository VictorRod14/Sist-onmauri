from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.seller import Seller
from models.user import User
from schemas.seller import (
    SellerCreate,
    SellerUpdate,
    SellerResponse,
    SellerCreatedResponse,
)
from core.security import hash_password
from core.permissions import require_roles

router = APIRouter(tags=["Sellers"])


# ===============================
# LISTAR VENDEDORAS
# admin + gerente
# ===============================
@router.get("/", response_model=list[SellerResponse])
def list_sellers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente")),
):
    return db.query(Seller).order_by(Seller.name.asc()).all()


# ===============================
# CRIAR VENDEDORA
# admin + gerente
# ===============================
@router.post("/", response_model=SellerCreatedResponse)
def create_seller(
    payload: SellerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente")),
):
    name = payload.name.strip()
    email = payload.email.strip().lower()

    if not name:
        raise HTTPException(status_code=400, detail="Nome é obrigatório")

    exists_seller = db.query(Seller).filter(Seller.email == email).first()
    if exists_seller:
        raise HTTPException(
            status_code=400,
            detail="Já existe uma vendedora com esse e-mail",
        )

    exists_user = db.query(User).filter(User.email == email).first()
    if exists_user:
        raise HTTPException(
            status_code=400,
            detail="Já existe um usuário com esse e-mail",
        )

    seller = Seller(name=name, email=email, active=True)
    db.add(seller)
    db.commit()
    db.refresh(seller)

    temp_password = "Vendedora@123"

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(temp_password),
        role="seller",
        is_active=True,
        is_locked=False,
        failed_attempts=0,
        must_change_password=True,
    )

    db.add(user)
    db.commit()

    return {
        "id": seller.id,
        "name": seller.name,
        "email": seller.email,
        "active": seller.active,
        "temp_password": temp_password,
    }


# ===============================
# EDITAR VENDEDORA
# admin + gerente
# ===============================
@router.put("/{seller_id}", response_model=SellerResponse)
def update_seller(
    seller_id: int,
    payload: SellerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente")),
):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()

    if not seller:
        raise HTTPException(status_code=404, detail="Vendedora não encontrada")

    if payload.name is not None:
        name = payload.name.strip()

        if not name:
            raise HTTPException(status_code=400, detail="Nome inválido")

        seller.name = name

        user = db.query(User).filter(User.email == seller.email).first()
        if user:
            user.name = name

    if payload.active is not None:
        seller.active = payload.active

    db.commit()
    db.refresh(seller)
    return seller


# ===============================
# DESATIVAR VENDEDORA
# SOMENTE ADMIN
# ===============================
@router.delete("/{seller_id}")
def delete_seller(
    seller_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()

    if not seller:
        raise HTTPException(status_code=404, detail="Vendedora não encontrada")

    seller.active = False

    user = db.query(User).filter(User.email == seller.email).first()
    if user:
        user.is_active = False

    db.commit()

    return {"ok": True}