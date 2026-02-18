# backend/app/schemas/bot_user.py
from pydantic import BaseModel
from datetime import datetime

class BotUserBase(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language_code: str | None = None
    source_bot_id: int
    is_blocked: bool = False

class GroupedBotUserResponse(BaseModel):
    id: int # ID of the LATEST interaction or main record
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language_code: str | None = None
    first_seen_at: datetime
    last_seen_at: datetime
    is_blocked: bool = False
    sources: list[str] = [] # List of Bot Names

    class Config:
        from_attributes = True

class PaginatedUsers(BaseModel):
    users: list[GroupedBotUserResponse]
    total: int
