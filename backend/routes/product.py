from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.product import Product
from schemas.product import ProductCreate, ProductResponse
from models.stock_audit import StockAudit
from models.notification import Notification

router = APIRouter(tags=["Products"])


# CRIAR (admin/gerente)
@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# LER SÓ PRODUTOS ATIVOS (todos logados)
@router.get("/", response_model=list[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
):
    return db.query(Product).filter(Product.active == True).all()


# UPDATE (admin/gerente)
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    old_stock = db_product.stock or 0
    new_stock = product.stock if product.stock is not None else old_stock

    # atualiza campos
    for field, value in product.model_dump().items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)



# DELETE (desativar) (admin/gerente)
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    db_product.active = False
    db.commit()
    return {"message": "Produto desativado com sucesso"}


# LISTAR SOMENTE PRODUTOS ATIVOS (público ou logado)
@router.get("/public", response_model=list[ProductResponse])
def list_active_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.active == True).all()