# backend/app/bot/handlers.py
from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.bot import Bot as BotModel
from app.models.message_template import MessageTemplate

router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message):
    # bot_user is injected by TrackingMiddleware
    # or we can just use message.from_user
    
    # Logic to find the correct welcome message
    # We need to know WHICH bot received this.
    # In aiogram 3, `bot` instance is available in context, and we can get token.
    # But finding the DB record ID from token every time is expensive?
    # Middleware can reuse the bot_id found during tracking.
    
    # Let's assume Middleware attaches `source_bot_id` to `data`
    # Warning: Middleware signature needs to be checked.
    pass 
    # Actually, let's implement the logic here for simplicity if middleware only does tracking.
    
    # Note: `bot_user` argument comes from middleware if we pass it in data.
    # See middleware implementation below.

    # 1. Get current bot token to identify source
    # properties of 'bot' are context aware in handlers usually
    bot_token = message.bot.token
    
    language_code = message.from_user.language_code
    
    async with AsyncSessionLocal() as db:
        # Find bot by token
        bot = await db.scalar(select(BotModel).where(BotModel.token == bot_token))
        if not bot:
            return

        # Find template
        # Try exact match language -> then fallback "ru" -> then any
        template = await db.scalar(
            select(MessageTemplate)
            .where(MessageTemplate.bot_id == bot.id)
            .where(MessageTemplate.language_code == language_code)
        )
        
        if not template:
            # Fallback to RU
            template = await db.scalar(
                select(MessageTemplate)
                .where(MessageTemplate.bot_id == bot.id)
                .where(MessageTemplate.language_code == "ru")
            )
            
        if not template:
            # Fallback to first available if RU missing
            template = await db.scalar(
                select(MessageTemplate)
                .where(MessageTemplate.bot_id == bot.id)
                .limit(1)
            )

        if not template:
            await message.answer("Welcome!") # Absolute fallback
            return

        # Prepare keyboard
        markup = None
        if template.buttons:
            markup = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=b['text'], url=b['url'])] for b in template.buttons
            ])
            
        await message.answer(template.text, reply_markup=markup)
