# backend/app/models/bot_user.py
from sqlalchemy import String, Integer, Boolean, DateTime, BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database import Base

class BotUser(Base):
    __tablename__ = "bot_users"
    __table_args__ = (
        UniqueConstraint('telegram_id', 'source_bot_id', name='uq_bot_user_telegram_source'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=True)
    first_name: Mapped[str] = mapped_column(String, nullable=True)
    last_name: Mapped[str] = mapped_column(String, nullable=True)
    language_code: Mapped[str] = mapped_column(String, nullable=True)
    
    source_bot_id: Mapped[int] = mapped_column(Integer, ForeignKey("bots.id"), nullable=False)
    
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Связи
    source_bot = relationship("Bot", back_populates="bot_users")
