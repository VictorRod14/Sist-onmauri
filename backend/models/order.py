from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from db.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    # total final já com desconto aplicado
    total = Column(Float, nullable=False)

    # novos campos
    seller = Column(String, nullable=True)
    payment = Column(String, nullable=False, default="pix")  # pix/credito/debito/dinheiro
    discount_type = Column(String, nullable=False, default="none")  # none/money/percent
    discount_value = Column(Float, nullable=False, default=0.0)
    note = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
