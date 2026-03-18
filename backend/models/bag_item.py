from sqlalchemy import Column, Integer, ForeignKey, Float
from db.database import Base


class BagItem(Base):
    __tablename__ = "bag_items"

    id = Column(Integer, primary_key=True, index=True)

    bag_id = Column(Integer, ForeignKey("bags.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    quantity_sent = Column(Integer, nullable=False)
    quantity_sold = Column(Integer, nullable=False, default=0)
    quantity_returned = Column(Integer, nullable=False, default=0)

    unit_price = Column(Float, nullable=False)