from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from app.models.user import UserRole

class UserRegister(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    email: str
    role: UserRole
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
