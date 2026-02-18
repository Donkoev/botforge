# backend/app/schemas/bot.py
from pydantic import BaseModel
from datetime import datetime

class BotBase(BaseModel):
    name: str
    token: str

class BotCreate(BotBase):
    pass

class BotUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None

class BotResponse(BaseModel):
    id: int
    name: str
    bot_username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    display_order: int = 0

    class Config:
        from_attributes = True
