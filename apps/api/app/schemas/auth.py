from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ApiErrorBody(BaseModel):
    kind: str
    message: str


class ApiErrorResponse(BaseModel):
    error: ApiErrorBody


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
