# backend/app/schemas/message_template.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any

class Button(BaseModel):
    text: str
    url: str

class MessageTemplateBase(BaseModel):
    language_code: str
    text: str
    buttons: List[Button] = []

class MessageTemplateCreate(MessageTemplateBase):
    pass

class MessageTemplateUpdate(BaseModel):
    text: str | None = None
    buttons: List[Button] | None = None

class MessageTemplateResponse(MessageTemplateBase):
    id: int
    bot_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
