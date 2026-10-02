from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.product import Product
from schemas.product import ProductCreate, ProductResponse

router = APIRouter(tags=["Products"])


@router.get("/next-code")
def get_next_product_code(db: Session = Depends(get_db)):
    highest = 0
    for (name,) in db.query(Product.name).all():
        first_part = (name or "").strip().split(" ", 1)[0]
        if first_part.isdigit():
            highest = max(highest, int(first_part))
    return {"next_code": str(highest + 1).zfill(5)}


def build_product_response(product: Product) -> dict:
    profit = None
    if product.cost_price is not None:
        profit = float(product.price) - float(product.cost_price)

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "stock": int(product.stock),
        "active": bool(product.active),
        "cost_price": float(product.cost_price) if product.cost_price is not None else None,
        "profit": profit,
    }


@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    data = product.model_dump()
    data["name"] = data["name"].strip().upper()
    if data.get("description"):
        data["description"] = data["description"].strip().upper()
    db_product = Product(**data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return build_product_response(db_product)


@router.get("/", response_model=list[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
):
    products = db.query(Product).filter(Product.active == True).all()
    return [build_product_response(product) for product in products]


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    data = product.model_dump()
    data["name"] = data["name"].strip().upper()
    if data.get("description"):
        data["description"] = data["description"].strip().upper()
    for field, value in data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)

    return build_product_response(db_product)


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


@router.get("/public", response_model=list[ProductResponse])
def list_active_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.active == True).all()
    return [build_product_response(product) for product in products]
