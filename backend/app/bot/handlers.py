# backend/app/bot/handlers.py
from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.bot import Bot as BotModel
from app.models.message_template import MessageTemplate


async def cmd_start(message: Message):
    bot_token = message.bot.token
    language_code = (message.from_user.language_code or "").lower()
    
    async with AsyncSessionLocal() as db:
        # Find bot by token
        bot = await db.scalar(select(BotModel).where(BotModel.token == bot_token))
        if not bot:
            return

        # Find template: exact language match → fallback "ru" → any available
        template = await db.scalar(
            select(MessageTemplate)
            .where(MessageTemplate.bot_id == bot.id)
            .where(func.lower(MessageTemplate.language_code) == language_code)
        )
        
        if not template:
            template = await db.scalar(
                select(MessageTemplate)
                .where(MessageTemplate.bot_id == bot.id)
                .where(func.lower(MessageTemplate.language_code) == "ru")
            )
            
        if not template:
            template = await db.scalar(
                select(MessageTemplate)
                .where(MessageTemplate.bot_id == bot.id)
                .limit(1)
            )

        if not template:
            await message.answer("Welcome!")
            return

        # Prepare inline keyboard
        markup = None
        if template.buttons:
            markup = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=b['text'], url=b['url'])] for b in template.buttons
            ])
            
        await message.answer(template.text, reply_markup=markup)

def create_main_router() -> Router:
    router = Router()
    router.message.register(cmd_start, CommandStart())
    return router
