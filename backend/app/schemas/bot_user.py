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

class BotUserResponse(BotUserBase):
    id: int
    first_seen_at: datetime
    last_seen_at: datetime

    class Config:
        from_attributes = True

class PaginatedUsers(BaseModel):
    users: list[BotUserResponse]
    total: int
