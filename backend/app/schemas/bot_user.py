# backend/app/schemas/bot_user.py
from pydantic import BaseModel
from datetime import datetime

class GroupedBotUserResponse(BaseModel):
    id: int
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language_code: str | None = None
    first_seen_at: datetime
    last_seen_at: datetime
    is_blocked: bool = False
    sources: list[str] = []

    class Config:
        from_attributes = True

class PaginatedUsers(BaseModel):
    users: list[GroupedBotUserResponse]
    total: int
