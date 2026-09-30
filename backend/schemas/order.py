from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    items: list[OrderItemCreate]

    seller: Optional[str] = None
    customer_name: Optional[str] = None
    payment: Literal["pix", "credito", "debito", "dinheiro"] = "pix"

    discount_type: Literal["none", "money", "percent"] = "none"
    discount_value: float = 0.0

    note: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    total: float

    seller: Optional[str] = None
    customer_name: Optional[str] = None
    payment: str
    discount_type: str
    discount_value: float
    note: Optional[str] = None

    created_at: datetime | None = None

    class Config:
        from_attributes = True

class SellerSaleItem(BaseModel):
    id: int
    total: float
    customer_name: Optional[str] = None
    payment: str
    items: int
    created_at: datetime | None = None

class SellerSalesResponse(BaseModel):
    days: int
    total: float
    orders: int
    items: int
    sales: list[SellerSaleItem]
