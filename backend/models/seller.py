from sqlalchemy import Column, Integer, String, Boolean
from db.database import Base


class Seller(Base):
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    active = Column(Boolean, default=True)