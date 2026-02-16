# backend/app/schemas/broadcast.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class BroadcastBase(BaseModel):
    title: str
    text: str | None = None
    media_type: str | None = None
    media_file_id: str | None = None
    buttons: list | None = None
    target_bots: List[int] = []

class BroadcastCreate(BroadcastBase):
    pass

class BroadcastResponse(BroadcastBase):
    id: int
    status: str
    total_users: int
    sent_count: int
    failed_count: int
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None

    class Config:
        from_attributes = True
