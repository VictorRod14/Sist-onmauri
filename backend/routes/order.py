from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.order import Order
from models.order_item import OrderItem
from models.product import Product
from schemas.order import OrderCreate, OrderResponse

router = APIRouter(tags=["Orders"])

@router.get("/", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.id.desc()).all()

@router.post("/", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # valida desconto
    discount_type = order.discount_type
    discount_value = float(order.discount_value or 0)

    if discount_value < 0:
        raise HTTPException(status_code=400, detail="Desconto não pode ser negativo")

    if discount_type == "percent" and discount_value > 100:
        raise HTTPException(status_code=400, detail="Desconto percentual máximo é 100")

    # calcula subtotal e baixa estoque
    subtotal = 0.0
    order_items = []

    for item in order.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.active == True
        ).first()

        if not product:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {product.name}")

        product.stock -= item.quantity

        line_total = float(product.price) * int(item.quantity)
        subtotal += line_total

        order_items.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price": float(product.price)
        })

    # desconto
    discount_amount = 0.0
    if discount_type == "money":
        discount_amount = min(discount_value, subtotal)
    elif discount_type == "percent":
        discount_amount = (discount_value / 100.0) * subtotal

    total = subtotal - discount_amount
    if total < 0:
        total = 0.0

    db_order = Order(
        total=total,
        seller=(order.seller.strip() if order.seller else None),
        payment=order.payment,
        discount_type=discount_type,
        discount_value=discount_value,
        note=(order.note.strip() if order.note else None),
    )

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for it in order_items:
        db.add(OrderItem(order_id=db_order.id, **it))

    db.commit()
    db.refresh(db_order)

    return db_order
