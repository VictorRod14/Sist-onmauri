from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock: int
    cost_price: float | None = None


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    active: bool
    profit: float | None = None

    class Config:
        from_attributes = True