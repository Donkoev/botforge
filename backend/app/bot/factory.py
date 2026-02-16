# backend/app/bot/factory.py
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from app.bot.handlers import router as main_router
from app.bot.middlewares import TrackingMiddleware

def create_bot(token: str) -> Bot:
    return Bot(token=token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))

def create_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    
    # Register middlewares
    dp.update.middleware(TrackingMiddleware())
    
    # Register routers
    dp.include_router(main_router)
    
    return dp
