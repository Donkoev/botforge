# backend/app/api/bot_users.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.database import get_db
from app.models.bot_user import BotUser
from app.schemas.bot_user import PaginatedUsers, BotUserResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=PaginatedUsers)
async def get_users(
    page: int = 1,
    limit: int = 20,
    bot_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(BotUser)
    
    if bot_id:
        query = query.where(BotUser.source_bot_id == bot_id)
    
    if search:
        # Simple search by username or first_name
        query = query.where(
            (BotUser.username.ilike(f"%{search}%")) | 
            (BotUser.first_name.ilike(f"%{search}%"))
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Pagination
    query = query.offset((page - 1) * limit).limit(limit).order_by(BotUser.last_seen_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()

    return {"users": users, "total": total}

@router.get("/export")
async def export_users(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # TODO: Implement CSV export
    return {"message": "Export not implemented yet"}
