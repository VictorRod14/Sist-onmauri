from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from db.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, default="info")  # info | warning | danger
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    # simples e eficiente: notifica por role
    for_role = Column(String, nullable=False)  # "admin" etc

    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())