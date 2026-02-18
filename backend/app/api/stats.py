# backend/app/api/stats.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta
from app.database import get_db
from app.models.bot_user import BotUser
from app.models.bot import Bot
from app.schemas.stats import StatsOverview, DailyStat
from app.api.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/overview", response_model=StatsOverview)
async def get_stats_overview(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    # Total users
    total_users = await db.scalar(select(func.count(func.distinct(BotUser.telegram_id))))
    
    # New today
    new_today = await db.scalar(
        select(func.count(func.distinct(BotUser.telegram_id))).where(BotUser.first_seen_at >= today_start)
    )
    
    # New this week
    new_week = await db.scalar(
        select(func.count(func.distinct(BotUser.telegram_id))).where(BotUser.first_seen_at >= week_start)
    )
    
    # Active bots
    active_bots = await db.scalar(
        select(func.count(Bot.id)).where(Bot.is_active == True)
    )

    return StatsOverview(
        total_users=total_users or 0,
        new_today=new_today or 0,
        new_week=new_week or 0,
        active_bots=active_bots or 0
    )

@router.get("/daily")
async def get_daily_stats(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Retrieve daily signups for the last N days
    # PostgreSQL specific date_trunc
    start_date = datetime.utcnow() - timedelta(days=days)
    
    stmt = (
        select(
            func.to_char(BotUser.first_seen_at, 'YYYY-MM-DD').label('date'),
            func.count(func.distinct(BotUser.telegram_id)).label('count')
        )
        .where(BotUser.first_seen_at >= start_date)
        .group_by(text('date')) # group by the formatted date string
        .order_by('date')
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    return [DailyStat(date=row.date, count=row.count) for row in rows]
