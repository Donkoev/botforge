# backend/app/services/stats_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.models.bot_user import BotUser
from app.models.bot import Bot

class StatsService:
    # Most logic is currently in the API endpoint direct queries.
    # This service can be used for more complex aggregations or caching in Redis.
    
    async def get_total_users(self, db: AsyncSession) -> int:
        return await db.scalar(select(func.count(BotUser.id))) or 0

    async def get_active_bots_count(self, db: AsyncSession) -> int:
        return await db.scalar(select(func.count(Bot.id)).where(Bot.is_active == True)) or 0

stats_service = StatsService()
