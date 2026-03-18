from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from db.database import get_db
from models.order import Order
from models.order_item import OrderItem
from models.product import Product
from schemas.report import ReportSummaryResponse

router = APIRouter(tags=["Reports"])

def _start_of_today():
    now = datetime.now()
    return datetime(now.year, now.month, now.day)

@router.get("/summary", response_model=ReportSummaryResponse)
def report_summary(
    db: Session = Depends(get_db),
    days: int = 30,
    limit_top: int = 5,
    limit_recent: int = 10,
):
    # período: últimos N dias (inclui hoje)
    days = max(1, min(days, 365))
    today = date.today()
    date_from = today - timedelta(days=days - 1)
    date_to = today

    # revenue / orders no período
    revenue = db.query(func.coalesce(func.sum(Order.total), 0.0)).scalar() or 0.0
    orders = db.query(func.count(Order.id)).scalar() or 0

    # itens no período (pela tabela order_items)
    items = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).scalar() or 0

    # hoje
    start_today = _start_of_today()
    revenue_today = (
        db.query(func.coalesce(func.sum(Order.total), 0.0))
        .filter(Order.created_at >= start_today)
        .scalar()
        or 0.0
    )
    orders_today = (
        db.query(func.count(Order.id))
        .filter(Order.created_at >= start_today)
        .scalar()
        or 0
    )

    # top produtos
    top_products = (
        db.query(
            OrderItem.product_id.label("product_id"),
            Product.name.label("name"),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("qty"),
            func.coalesce(func.sum(OrderItem.price * OrderItem.quantity), 0.0).label("revenue"),
        )
        .join(Product, Product.id == OrderItem.product_id)
        .group_by(OrderItem.product_id, Product.name)
        .order_by(func.sum(OrderItem.price * OrderItem.quantity).desc())
        .limit(limit_top)
        .all()
    )

    # top vendedoras (se seller existir no Order)
    top_sellers = (
        db.query(
            func.coalesce(Order.seller, "Sem vendedora").label("seller"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total), 0.0).label("revenue"),
        )
        .group_by(func.coalesce(Order.seller, "Sem vendedora"))
        .order_by(func.sum(Order.total).desc())
        .limit(limit_top)
        .all()
    )

    # últimas vendas
    recent_orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(limit_recent)
        .all()
    )

    return {
        "date_from": date_from,
        "date_to": date_to,
        "revenue": float(revenue),
        "orders": int(orders),
        "items": int(items),
        "revenue_today": float(revenue_today),
        "orders_today": int(orders_today),
        "top_products": [
            {"product_id": int(r.product_id), "name": r.name, "qty": int(r.qty), "revenue": float(r.revenue)}
            for r in top_products
        ],
        "top_sellers": [
            {"seller": r.seller, "orders": int(r.orders), "revenue": float(r.revenue)}
            for r in top_sellers
        ],
        "recent_orders": [
            {
                "id": o.id,
                "total": float(o.total),
                "seller": getattr(o, "seller", None),
                "payment": getattr(o, "payment", None),
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders
        ],
    }