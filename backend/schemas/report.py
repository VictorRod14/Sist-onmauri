from pydantic import BaseModel
from datetime import date
from typing import List

class ReportTopProduct(BaseModel):
    product_id: int
    name: str
    qty: int
    revenue: float

class ReportTopSeller(BaseModel):
    seller: str
    orders: int
    revenue: float

class ReportRecentOrder(BaseModel):
    id: int
    total: float
    seller: str | None = None
    payment: str | None = None
    created_at: str | None = None  # iso

class ReportSummaryResponse(BaseModel):
    date_from: date
    date_to: date

    revenue: float
    orders: int
    items: int

    revenue_today: float
    orders_today: int

    top_products: List[ReportTopProduct]
    top_sellers: List[ReportTopSeller]
    recent_orders: List[ReportRecentOrder]