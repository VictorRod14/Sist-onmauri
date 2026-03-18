from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.init_db import init_db
from routes.product import router as product_router
from routes.order import router as order_router
from routes.seller import router as seller_router
from routes.report import router as report_router
from routes.notifications import router as notifications_router
from routes.auth import router as auth_router



app = FastAPI(
    title="Sistema OnMauri",
    description="Sistema de gestão da loja OnMauri",
    version="1.0.0",
)

# 🔥 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
         "https://sistema-onmauri-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(product_router, prefix="/products", tags=["Products"])
app.include_router(order_router, prefix="/orders", tags=["Orders"])
app.include_router(seller_router, prefix="/sellers")

@app.get("/health")
def health():
    return {"status": "ok", "system": "OnMauri"}

app.include_router(report_router, prefix="/reports", tags=["Reports"])

app.include_router(notifications_router)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])