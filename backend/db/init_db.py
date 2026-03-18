from sqlalchemy.orm import Session

from db.database import engine, Base, SessionLocal

# importa models (pra criar as tabelas)
from models.product import Product  # noqa: F401
from models.seller import Seller    # noqa: F401
from models.order import Order      # noqa: F401
from models.order_item import OrderItem  # noqa: F401
from models.user import User  # <- precisa existir

from core.security import hash_password


def seed_users():
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        db.add_all([
    User(
        name="Administrador",
        email="admin@onmauri.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
        is_active=True,
        is_locked=False,
        failed_attempts=0,
        must_change_password=False,  # pode deixar false pro admin não ser forçado
    ),
    User(
        name="Gerente",
        email="gerente@onmauri.com",
        password_hash=hash_password("Gerente@123"),
        role="gerente",
        is_active=True,
        is_locked=False,
        failed_attempts=0,
        must_change_password=False,
    ),
    User(
        name="Vendedora Teste",
        email="vendedora@onmauri.com",
        password_hash=hash_password("Vendedora@123"),
        role="vendedora",
        is_active=True,
        is_locked=False,
        failed_attempts=0,
        must_change_password=True,  # legal forçar trocar no 1º login
    ),
])
        db.commit()
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    seed_users()