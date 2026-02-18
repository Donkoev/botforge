# backend/app/bot/middlewares.py
from typing import Callable, Dict, Any, Awaitable
import logging
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message, CallbackQuery
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.database import AsyncSessionLocal
from app.models.bot import Bot as BotModel
from app.models.bot_user import BotUser
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class TrackingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        
        user = None
        if isinstance(event, Message):
            user = event.from_user
        elif isinstance(event, CallbackQuery):
            user = event.from_user
            
        if not user:
            return await handler(event, data)

        bot = data.get("bot")
        if not bot:
            logger.warning("TrackingMiddleware: No bot instance found in data")
            return await handler(event, data)

        async with AsyncSessionLocal() as db:
            bot_model = await db.scalar(select(BotModel).where(BotModel.token == bot.token))
            if not bot_model:
                logger.warning("TrackingMiddleware: Unknown bot")
                return await handler(event, data)

            logger.info(f"TrackingMiddleware: Bot ID {bot_model.id}, user {user.id}")

            # Upsert BotUser
            try:
                now = datetime.now(timezone.utc).replace(tzinfo=None)
                stmt = insert(BotUser).values(
                    telegram_id=user.id,
                    username=user.username,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    language_code=user.language_code,
                    source_bot_id=bot_model.id,
                    first_seen_at=now,
                    last_seen_at=now
                ).on_conflict_do_update(
                    constraint='uq_bot_user_telegram_source', 
                    set_=dict(
                        username=user.username,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        language_code=user.language_code,
                        last_seen_at=now,
                        is_blocked=False
                    )
                )
                
                await db.execute(stmt)
                await db.commit()
            except Exception as e:
                logger.error(f"TrackingMiddleware Error: {e}")
            
            data["source_bot_id"] = bot_model.id

        return await handler(event, data)
