from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from db.database import Base


class StockAudit(Base):
    __tablename__ = "stock_audits"

    id = Column(Integer, primary_key=True, index=True)

    # produto continua com FK (existe)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    # 👇 REMOVE FK PARA USERS (AINDA NÃO EXISTE)
    actor_user_id = Column(Integer, nullable=True)

    action = Column(String, nullable=False)  # "update_stock"
    old_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())