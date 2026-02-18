# backend/app/api/bot_users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.database import get_db
from app.models.bot_user import BotUser
from app.models.bot import Bot as BotModel
from app.schemas.bot_user import PaginatedUsers, GroupedBotUserResponse
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
    distinct_query = (
        select(BotUser.telegram_id, func.max(BotUser.last_seen_at).label("max_seen"))
        .join(BotUser.source_bot)
    )
    
    if bot_id:
        distinct_query = distinct_query.where(BotUser.source_bot_id == bot_id)
        
    if search:
         distinct_query = distinct_query.where(
            (BotUser.username.ilike(f"%{search}%")) | 
            (BotUser.first_name.ilike(f"%{search}%"))
        )
        
    distinct_query = distinct_query.group_by(BotUser.telegram_id)
    
    # Count total unique users
    total_query = select(func.count()).select_from(distinct_query.subquery())
    total = (await db.execute(total_query)).scalar_one()

    # Pagination on unique users
    distinct_query = distinct_query.order_by(func.max(BotUser.last_seen_at).desc())
    distinct_query = distinct_query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(distinct_query)
    rows = result.all()
    target_ids = [r[0] for r in rows]
    
    if not target_ids:
        return {"users": [], "total": 0}

    # Fetch details for these IDs and aggregate sources
    details_query = (
        select(BotUser, BotModel.name.label("bot_name"))
        .join(BotModel, BotUser.source_bot_id == BotModel.id)
        .where(BotUser.telegram_id.in_(target_ids))
        .order_by(BotUser.last_seen_at.desc())
    )
    
    details_result = await db.execute(details_query)
    details = details_result.all()
    
    grouped = {}
    for user, bot_name in details:
        tid = user.telegram_id
        if tid not in grouped:
            grouped[tid] = {
                "id": user.id,
                "telegram_id": tid,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "language_code": user.language_code,
                "first_seen_at": user.first_seen_at,
                "last_seen_at": user.last_seen_at,
                "is_blocked": user.is_blocked,
                "sources": []
            }
        
        if bot_name and bot_name not in grouped[tid]["sources"]:
            grouped[tid]["sources"].append(bot_name)
        
    final_users = []
    for tid in target_ids:
        if tid in grouped:
            final_users.append(grouped[tid])

    return {"users": final_users, "total": total}

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = await db.get(BotUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}
