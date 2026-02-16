# backend/app/bot/middlewares.py
from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.database import AsyncSessionLocal
from app.models.bot import Bot as BotModel
from app.models.bot_user import BotUser
from datetime import datetime

class TrackingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        
        # Only track Messages for now
        if not isinstance(event, Message):
            return await handler(event, data)

        user = event.from_user
        if not user:
             return await handler(event, data)

        bot = data.get("bot") # aiogram injects bot instance
        if not bot:
            return await handler(event, data)

        async with AsyncSessionLocal() as db:
            # Resolve Bot DB ID
            # In high load, cache this {token -> id} mapping
            bot_model = await db.scalar(select(BotModel).where(BotModel.token == bot.token))
            if not bot_model:
                # Unknown bot?
                return await handler(event, data)

            # Upsert BotUser
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
                index_elements=['telegram_id'], # Unique constraint
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
            
            # Pass data to handlers if needed
            data["source_bot_id"] = bot_model.id

        return await handler(event, data)
