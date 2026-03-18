from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from db.database import Base


class Bag(Base):
    __tablename__ = "bags"

    id = Column(Integer, primary_key=True, index=True)

    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)

    status = Column(String, nullable=False, default="open")

    note = Column(String, nullable=True)

    created_by_user_id = Column(Integer, nullable=True)

    payment = Column(String, nullable=True)
    seller = Column(String, nullable=True)

    total_sold_amount = Column(Float, nullable=False, default=0.0)
    order_id = Column(Integer, nullable=True)

    date_out = Column(DateTime(timezone=True), server_default=func.now())
    returned_at = Column(DateTime(timezone=True), nullable=True)