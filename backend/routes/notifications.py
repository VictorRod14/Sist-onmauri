from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
def list_notifications(
    db: Session = Depends(get_db),
):
    return db.query(Notification).filter(
        Notification.for_role == "admin"
    ).order_by(Notification.id.desc()).all()