# backend/app/models/message_template.py
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database import Base

class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bot_id: Mapped[int] = mapped_column(Integer, ForeignKey("bots.id"), nullable=False)
    language_code: Mapped[str] = mapped_column(String, default="ru", nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    buttons: Mapped[list] = mapped_column(JSON, default=list) # [{text: "Btn", url: "http..."}]
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), server_onupdate=func.now(), default=func.now(), onupdate=func.now())

    # Связи
    bot = relationship("Bot", back_populates="templates")
