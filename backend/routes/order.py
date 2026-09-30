from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from db.database import get_db
from models.order import Order
from models.order_item import OrderItem
from models.product import Product
from schemas.order import OrderCreate, OrderResponse, SellerSalesResponse
from models.user import User
from core.auth_deps import get_current_user
from core.permissions import require_roles

router = APIRouter(tags=["Orders"])

@router.get("/", response_model=list[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente", "manager")),
):
    return db.query(Order).order_by(Order.id.desc()).all()


@router.get("/mine", response_model=SellerSalesResponse)
def list_my_orders(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("seller", "vendedora")),
):
    days = max(1, min(days, 365))
    date_from = datetime.now() - timedelta(days=days - 1)

    ownership = or_(
        Order.created_by_user_id == current_user.id,
        func.lower(func.coalesce(Order.seller, "")) == current_user.name.strip().lower(),
    )

    orders = (
        db.query(Order)
        .filter(ownership, Order.created_at >= date_from)
        .order_by(Order.created_at.desc())
        .all()
    )

    sales = []
    total_items = 0
    for order in orders:
        items = (
            db.query(func.coalesce(func.sum(OrderItem.quantity), 0))
            .filter(OrderItem.order_id == order.id)
            .scalar()
            or 0
        )
        total_items += int(items)
        sales.append({
            "id": order.id,
            "total": float(order.total),
            "customer_name": order.customer_name,
            "payment": order.payment,
            "items": int(items),
            "created_at": order.created_at,
        })

    return {
        "days": days,
        "total": float(sum(order.total for order in orders)),
        "orders": len(orders),
        "items": total_items,
        "sales": sales,
    }

@router.post("/", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    is_seller = current_user.role in ("seller", "vendedora")
    seller_name = current_user.name if is_seller else (order.seller.strip() if order.seller else None)

    db_order = Order(
        total=total,
        seller=seller_name,
        customer_name=(order.customer_name.strip() if order.customer_name else None),
        created_by_user_id=current_user.id,
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
