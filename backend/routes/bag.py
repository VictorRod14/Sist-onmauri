from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.bag import Bag
from models.bag_item import BagItem
from models.order import Order
from models.order_item import OrderItem
from models.product import Product
from models.user import User
from schemas.bag import BagCreate, BagReturn, BagResponse
from core.permissions import require_roles

router = APIRouter(tags=["Bags"])


def _build_bag_response(db: Session, bag: Bag) -> dict:
    bag_items = db.query(BagItem).filter(BagItem.bag_id == bag.id).all()

    items_response = []

    for item in bag_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        items_response.append(
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": product.name if product else None,
                "quantity_sent": item.quantity_sent,
                "quantity_sold": item.quantity_sold,
                "quantity_returned": item.quantity_returned,
                "unit_price": float(item.unit_price),
            }
        )

    return {
        "id": bag.id,
        "customer_name": bag.customer_name,
        "customer_phone": bag.customer_phone,
        "status": bag.status,
        "note": bag.note,
        "payment": bag.payment,
        "seller": bag.seller,
        "total_sold_amount": float(bag.total_sold_amount or 0.0),
        "order_id": bag.order_id,
        "date_out": bag.date_out,
        "returned_at": bag.returned_at,
        "items": items_response,
    }


@router.get("/", response_model=list[BagResponse])
def list_bags(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente", "manager")),
):
    bags = db.query(Bag).order_by(Bag.id.desc()).all()
    return [_build_bag_response(db, bag) for bag in bags]


@router.get("/{bag_id}", response_model=BagResponse)
def get_bag(
    bag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente", "manager")),
):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()

    if not bag:
        raise HTTPException(status_code=404, detail="Mala não encontrada")

    return _build_bag_response(db, bag)


@router.post("/", response_model=BagResponse)
def create_bag(
    payload: BagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente", "manager")),
):
    customer_name = (payload.customer_name or "").strip()

    if not customer_name:
        raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório")

    if not payload.items:
        raise HTTPException(status_code=400, detail="A mala precisa ter pelo menos 1 produto")

    normalized_items = []
    seen_products = set()

    for item in payload.items:
        if item.product_id in seen_products:
            raise HTTPException(
                status_code=400,
                detail="Produto repetido na mala. Envie cada produto apenas uma vez",
            )
        seen_products.add(item.product_id)

        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.active == True
        ).first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Produto {item.product_id} não encontrado")

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente para {product.name}",
            )

        product.stock -= item.quantity

        normalized_items.append(
            {
                "product_id": product.id,
                "quantity_sent": int(item.quantity),
                "unit_price": float(product.price),
            }
        )

    bag = Bag(
        customer_name=customer_name,
        customer_phone=(payload.customer_phone.strip() if payload.customer_phone else None),
        status="open",
        note=(payload.note.strip() if payload.note else None),
        created_by_user_id=current_user.id,
    )

    db.add(bag)
    db.flush()

    for item in normalized_items:
        db.add(
            BagItem(
                bag_id=bag.id,
                product_id=item["product_id"],
                quantity_sent=item["quantity_sent"],
                quantity_sold=0,
                quantity_returned=0,
                unit_price=item["unit_price"],
            )
        )

    db.commit()
    db.refresh(bag)

    return _build_bag_response(db, bag)


@router.post("/{bag_id}/return", response_model=BagResponse)
def return_bag(
    bag_id: int,
    payload: BagReturn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "gerente", "manager")),
):
    bag = db.query(Bag).filter(Bag.id == bag_id).first()

    if not bag:
        raise HTTPException(status_code=404, detail="Mala não encontrada")

    if bag.status != "open":
        raise HTTPException(status_code=400, detail="Essa mala já foi finalizada")

    db_items = db.query(BagItem).filter(BagItem.bag_id == bag.id).all()

    if not db_items:
        raise HTTPException(status_code=400, detail="A mala não possui itens")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Informe os itens vendidos e devolvidos")

    payload_map = {}
    for item in payload.items:
        if item.product_id in payload_map:
            raise HTTPException(
                status_code=400,
                detail="Produto repetido no retorno da mala",
            )
        payload_map[item.product_id] = item

    sold_order_items = []
    total_sold_amount = 0.0

    for db_item in db_items:
        product = db.query(Product).filter(Product.id == db_item.product_id).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Produto vinculado à mala não encontrado: {db_item.product_id}",
            )

        if db_item.product_id not in payload_map:
            raise HTTPException(
                status_code=400,
                detail=f"Faltou informar o produto {product.name} no retorno da mala",
            )

        item_data = payload_map[db_item.product_id]

        quantity_sold = int(item_data.quantity_sold)
        quantity_returned = int(item_data.quantity_returned)

        if quantity_sold < 0 or quantity_returned < 0:
            raise HTTPException(status_code=400, detail="Quantidades inválidas")

        if quantity_sold + quantity_returned != db_item.quantity_sent:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"O total vendido + devolvido de {product.name} "
                    f"deve ser exatamente {db_item.quantity_sent}"
                ),
            )

        db_item.quantity_sold = quantity_sold
        db_item.quantity_returned = quantity_returned

        if quantity_returned > 0:
            product.stock += quantity_returned

        if quantity_sold > 0:
            line_total = float(db_item.unit_price) * quantity_sold
            total_sold_amount += line_total

            sold_order_items.append(
                {
                    "product_id": db_item.product_id,
                    "quantity": quantity_sold,
                    "price": float(db_item.unit_price),
                }
            )

    if sold_order_items:
        order_note = f"Venda gerada por retorno de mala #{bag.id}"
        if payload.note and payload.note.strip():
            order_note = f"{order_note} - {payload.note.strip()}"

        created_order = Order(
            total=total_sold_amount,
            seller=(payload.seller.strip() if payload.seller else None),
            payment=payload.payment,
            discount_type="none",
            discount_value=0.0,
            note=order_note,
        )

        db.add(created_order)
        db.flush()

        for item in sold_order_items:
            db.add(
                OrderItem(
                    order_id=created_order.id,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    price=item["price"],
                )
            )

        bag.order_id = created_order.id
        bag.payment = payload.payment
        bag.seller = payload.seller.strip() if payload.seller else None
    else:
        bag.order_id = None
        bag.payment = None
        bag.seller = payload.seller.strip() if payload.seller else None

    if payload.note and payload.note.strip():
        if bag.note and bag.note.strip():
            bag.note = f"{bag.note.strip()} | Retorno: {payload.note.strip()}"
        else:
            bag.note = f"Retorno: {payload.note.strip()}"

    bag.total_sold_amount = total_sold_amount
    bag.status = "returned"
    bag.returned_at = datetime.now()

    db.commit()
    db.refresh(bag)

    return _build_bag_response(db, bag)