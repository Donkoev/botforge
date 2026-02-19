# backend/app/api/bots.py
import time
import logging
from typing import List
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models.bot import Bot
from app.schemas.bot import BotCreate, BotUpdate, BotResponse
from app.api.auth import get_current_user
from app.services.bot_manager import bot_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bots", tags=["bots"])

# Simple in-memory avatar cache: {bot_id: (bytes, timestamp)}
_avatar_cache: dict[int, tuple[bytes, float]] = {}
_AVATAR_CACHE_TTL = 600  # 10 minutes

@router.get("/", response_model=List[BotResponse])
async def get_bots(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Bot).order_by(Bot.display_order, Bot.id))
    return result.scalars().all()

@router.post("/", response_model=BotResponse)
async def create_bot(
    bot_in: BotCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if token exists
    result = await db.execute(select(Bot).where(Bot.token == bot_in.token))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bot with this token already exists")

    # Validate token with Telegram API
    try:
        from aiogram import Bot as AiogramBot
        # Verify and get bot info
        temp_bot = AiogramBot(token=bot_in.token)
        bot_info = await temp_bot.get_me()
        bot_username = bot_info.username
        await temp_bot.session.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid token or Telegram API error: {e}")

    new_bot = Bot(
        name=bot_in.name,
        token=bot_in.token,
        bot_username=bot_username
    )
    db.add(new_bot)
    await db.commit()
    await db.refresh(new_bot)
    return new_bot

@router.get("/{id}", response_model=BotResponse)
async def get_bot(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot

@router.patch("/{id}", response_model=BotResponse)
async def update_bot(
    id: int,
    bot_update: BotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if bot_update.name is not None:
        bot.name = bot_update.name
    if bot_update.is_active is not None:
        bot.is_active = bot_update.is_active

    await db.commit()
    await db.refresh(bot)
    return bot

@router.delete("/{id}")
async def delete_bot(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Stop bot if running
    await bot_manager.stop_bot(id)

    await db.delete(bot)
    await db.commit()
    return {"ok": True}

@router.post("/{id}/start")
async def start_bot_endpoint(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.is_active = True
    await db.commit()
    await bot_manager.start_bot(id)
    return {"status": "started"}

@router.post("/{id}/stop")
async def stop_bot_endpoint(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.is_active = False
    await db.commit()
    await bot_manager.stop_bot(id)
    return {"status": "stopped"}

@router.post("/reorder")
async def reorder_bots(
    items: List[dict],  # List of {id: int, display_order: int}
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Expecting [{"id": 1, "display_order": 0}, {"id": 2, "display_order": 1}, ...]
    for item in items:
        bot_id = item.get("id")
        order = item.get("display_order")
        if bot_id is not None and order is not None:
             await db.execute(
                 update(Bot).where(Bot.id == bot_id).values(display_order=order)
             )
    await db.commit()
    return {"status": "ok"}

@router.get("/{id}/avatar")
async def get_bot_avatar(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Proxy bot avatar from Telegram. Cached for 10 minutes."""
    # Check cache
    cached = _avatar_cache.get(id)
    if cached and time.time() - cached[1] < _AVATAR_CACHE_TTL:
        return StreamingResponse(BytesIO(cached[0]), media_type="image/jpeg")

    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    try:
        from aiogram import Bot as AiogramBot
        import httpx

        temp_bot = AiogramBot(token=bot.token)
        bot_info = await temp_bot.get_me()
        photos = await temp_bot.get_user_profile_photos(bot_info.id, limit=1)

        if photos.total_count == 0:
            await temp_bot.session.close()
            raise HTTPException(status_code=404, detail="Bot has no avatar")

        # Get the largest size of the first photo
        file_id = photos.photos[0][-1].file_id
        file = await temp_bot.get_file(file_id)
        file_url = f"https://api.telegram.org/file/bot{bot.token}/{file.file_path}"
        await temp_bot.session.close()

        # Download
        async with httpx.AsyncClient() as client:
            resp = await client.get(file_url, timeout=10)
            resp.raise_for_status()
            avatar_bytes = resp.content

        # Cache
        _avatar_cache[id] = (avatar_bytes, time.time())

        return StreamingResponse(BytesIO(avatar_bytes), media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch avatar for bot {id}: {e}")
        raise HTTPException(status_code=404, detail="Could not fetch avatar")
