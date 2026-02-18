# backend/app/models/broadcast.py
from sqlalchemy import String, Integer, Text, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.database import Base

class Broadcast(Base):
    __tablename__ = "broadcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=True)
    media_type: Mapped[str] = mapped_column(String, nullable=True) # photo, video, document, animation
    media_file_id: Mapped[str] = mapped_column(String, nullable=True)
    buttons: Mapped[list] = mapped_column(JSON, nullable=True)
    target_bots: Mapped[list] = mapped_column(JSON, default=list) # list of bot_ids
    
    status: Mapped[str] = mapped_column(String, default="draft") # draft, sending, completed, cancelled
    
    total_users: Mapped[int] = mapped_column(Integer, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
