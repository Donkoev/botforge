# backend/app/api/bots.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.bot import Bot
from app.schemas.bot import BotCreate, BotUpdate, BotResponse
from app.api.auth import get_current_user
# services import will be added later when implemented
from app.services.bot_manager import bot_manager

router = APIRouter(prefix="/bots", tags=["bots"])

@router.get("/", response_model=List[BotResponse])
async def get_bots(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Bot).order_by(Bot.id))
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

    # In a real app, we would validate the token with Telegram API here.
    # self.bot = Bot(token=token); await self.bot.get_me() ...

    # Placeholder for get_me logic:
    # Fetch bot info from Telegram
    try:
        from aiogram import Bot as AiogramBot
        # Use a temporary bot instance to check token and get info
        # We don't use default properties here as we just need get_me
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
        # Logic to start/stop bot via BotManager should be triggered here or in separate endpoints

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
    # Integration with BotManager later
    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.is_active = True
    await db.commit()
    # bot_manager.start_bot(id)
    await bot_manager.start_bot(id)
    return {"status": "started"}

@router.post("/{id}/stop")
async def stop_bot_endpoint(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Integration with BotManager later
    result = await db.execute(select(Bot).where(Bot.id == id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    bot.is_active = False
    await db.commit()
    await bot_manager.stop_bot(id)
    return {"status": "stopped"}
