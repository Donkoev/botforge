# backend/app/api/messages.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.message_template import MessageTemplate
from app.models.bot import Bot
from app.schemas.message_template import MessageTemplateCreate, MessageTemplateUpdate, MessageTemplateResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/bots/{bot_id}/messages", tags=["messages"])

@router.get("/", response_model=List[MessageTemplateResponse])
async def get_bot_messages(
    bot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(MessageTemplate).where(MessageTemplate.bot_id == bot_id))
    return result.scalars().all()

@router.post("/", response_model=MessageTemplateResponse)
async def create_bot_message(
    bot_id: int,
    msg_in: MessageTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if bot exists
    bot_res = await db.execute(select(Bot).where(Bot.id == bot_id))
    if not bot_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Bot not found")

    # Check if template for this language already exists
    existing = await db.execute(
        select(MessageTemplate)
        .where(MessageTemplate.bot_id == bot_id)
        .where(MessageTemplate.language_code == msg_in.language_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Template for language '{msg_in.language_code}' already exists")

    new_msg = MessageTemplate(
        bot_id=bot_id,
        language_code=msg_in.language_code,
        text=msg_in.text,
        buttons=[b.model_dump() for b in msg_in.buttons] if msg_in.buttons else []
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)
    return new_msg

@router.patch("/{msg_id}", response_model=MessageTemplateResponse)
async def update_bot_message(
    bot_id: int,
    msg_id: int,
    msg_update: MessageTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(MessageTemplate)
        .where(MessageTemplate.id == msg_id)
        .where(MessageTemplate.bot_id == bot_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Template not found")

    if msg_update.text is not None:
        msg.text = msg_update.text
    if msg_update.buttons is not None:
        msg.buttons = [b.model_dump() for b in msg_update.buttons]

    await db.commit()
    await db.refresh(msg)
    return msg

@router.delete("/{msg_id}")
async def delete_bot_message(
    bot_id: int,
    msg_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(MessageTemplate)
        .where(MessageTemplate.id == msg_id)
        .where(MessageTemplate.bot_id == bot_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Template not found")

    await db.delete(msg)
    await db.commit()
    return {"ok": True}
