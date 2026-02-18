# backend/app/api/bot_users.py
from fastapi import APIRouter, Depends, Query
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
    # 1. Base query for filtering
    query = select(BotUser).join(BotUser.source_bot)
    
    if bot_id:
        query = query.where(BotUser.source_bot_id == bot_id)
    
    if search:
        query = query.where(
            (BotUser.username.ilike(f"%{search}%")) | 
            (BotUser.first_name.ilike(f"%{search}%"))
        )

    # 2. Get distinct telegram_ids for pagination (filtering applied)
    # We need to filter FIRST, then group.
    
    # Subquery to identify which telegram_ids match the filter
    # SQL: SELECT distinct telegram_id FROM bot_users ... ORDER BY MAX(last_seen_at)
    
    # Simplified approach: fetch all matching records, then group in python? 
    # No, risky for large DB.
    
    # Correct approach:
    # Group by telegram_id, Get MAX(last_seen_at) for sorting
    
    # Helper to get unique telegram_ids matching criteria
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
    rows = result.all() # [(telegram_id, max_seen), ...]
    target_ids = [r[0] for r in rows]
    
    if not target_ids:
        return {"users": [], "total": 0}

    # 3. Fetch details for these IDs
    # We need all records for these telegram_ids to aggregate sources
    details_query = (
        select(BotUser, BotModel.name.label("bot_name"))
        .join(BotModel, BotUser.source_bot_id == BotModel.id)
        .where(BotUser.telegram_id.in_(target_ids))
        .order_by(BotUser.last_seen_at.desc())
    )
    
    details_result = await db.execute(details_query)
    details = details_result.all() # [(BotUser, bot_name), ...]
    
    # 4. Group in Python
    grouped = {}
    for user, bot_name in details:
        tid = user.telegram_id
        if tid not in grouped:
            grouped[tid] = {
                "id": user.id, # Use latest record ID
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
        
        # Aggregate sources
        # Only add if not exists (though bot_name should be unique per bot)
        if bot_name and bot_name not in grouped[tid]["sources"]:
            grouped[tid]["sources"].append(bot_name)
            
        # Update latest info if needed (already sorted by desc last_seen, so first hit is latest)
        
    # Convert to list respecting the sorted order of target_ids
    final_users = []
    for tid in target_ids:
        if tid in grouped:
            final_users.append(grouped[tid])

    return {"users": final_users, "total": total}

@router.get("/export")
async def export_users(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # TODO: Implement CSV export
    return {"message": "Export not implemented yet"}

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = await db.get(BotUser, user_id)
    if not user:
        return {"error": "User not found"}
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}
