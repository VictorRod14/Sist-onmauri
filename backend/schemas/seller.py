from pydantic import BaseModel, EmailStr


class SellerCreate(BaseModel):
    name: str
    email: EmailStr


class SellerUpdate(BaseModel):
    name: str | None = None
    active: bool | None = None


class SellerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    active: bool

    class Config:
        from_attributes = True


class SellerCreatedResponse(SellerResponse):
    temp_password: str