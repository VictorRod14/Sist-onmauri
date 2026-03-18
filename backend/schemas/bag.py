from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


class BagItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class BagCreate(BaseModel):
    customer_name: str
    customer_phone: str | None = None
    items: list[BagItemCreate]
    note: str | None = None


class BagItemReturn(BaseModel):
    product_id: int
    quantity_sold: int = Field(0, ge=0)
    quantity_returned: int = Field(0, ge=0)


class BagReturn(BaseModel):
    items: list[BagItemReturn]
    payment: Literal["pix", "credito", "debito", "dinheiro"] = "pix"
    seller: str | None = None
    note: str | None = None


class BagItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    quantity_sent: int
    quantity_sold: int
    quantity_returned: int
    unit_price: float

    class Config:
        from_attributes = True


class BagResponse(BaseModel):
    id: int
    customer_name: str
    customer_phone: str | None = None
    status: str
    note: str | None = None
    payment: str | None = None
    seller: str | None = None
    total_sold_amount: float
    order_id: int | None = None
    date_out: datetime | None = None
    returned_at: datetime | None = None
    items: list[BagItemResponse]

    class Config:
        from_attributes = True