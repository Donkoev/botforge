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
from datetime import datetime

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

        bot = data.get("bot") # aiogram injects bot instance
        if not bot:
            logger.warning("TrackingMiddleware: No bot instance found in data")
            return await handler(event, data)

        async with AsyncSessionLocal() as db:
            # Resolve Bot DB ID
            # In high load, cache this {token -> id} mapping
            bot_model = await db.scalar(select(BotModel).where(BotModel.token == bot.token))
            if not bot_model:
                logger.warning(f"TrackingMiddleware: Unknown bot token {bot.token}")
                return await handler(event, data)

            # Upsert BotUser
            try:
                stmt = insert(BotUser).values(
                    telegram_id=user.id,
                    username=user.username,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    language_code=user.language_code,
                    source_bot_id=bot_model.id,
                    first_seen_at=datetime.utcnow(),
                    last_seen_at=datetime.utcnow()
                ).on_conflict_do_update(
                    constraint='uq_bot_user_telegram_source', # Use constraint name if possible, or index_elements
                    # index_elements=['telegram_id', 'source_bot_id'], # This might require appropriate unique index
                    # Better to use constraint name if we defined it, but for SQLite/PG generic support without migration tool knowledge:
                    index_elements=['telegram_id', 'source_bot_id'],
                    set_=dict(
                        username=user.username,
                        first_name=user.first_name,
                        last_name=user.last_name, 
                        last_seen_at=datetime.utcnow(),
                        is_blocked=False # If they write, they unblocked us
                    )
                )
                
                await db.execute(stmt)
                await db.commit()
                # logger.info(f"Tracked user {user.id} for bot {bot_model.id}")
            except Exception as e:
                logger.error(f"TrackingMiddleware Error: {e}")
            
            # Pass data to handlers if needed
            data["source_bot_id"] = bot_model.id

        return await handler(event, data)
