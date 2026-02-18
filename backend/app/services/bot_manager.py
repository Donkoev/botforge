# backend/app/services/bot_manager.py
import asyncio
import logging
from typing import Dict, Tuple
from aiogram import Bot, Dispatcher
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.bot import Bot as BotModel
from app.bot.factory import create_bot, create_dispatcher

logger = logging.getLogger(__name__)

class BotManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BotManager, cls).__new__(cls)
            cls._instance.active_bots: Dict[int, Tuple[asyncio.Task, Bot]] = {}
        return cls._instance

    async def start_bot(self, bot_id: int):
        if bot_id in self.active_bots:
            logger.warning(f"Bot {bot_id} is already running")
            return

        async with AsyncSessionLocal() as db:
            bot_data = await db.scalar(select(BotModel).where(BotModel.id == bot_id))
            if not bot_data or not bot_data.token:
                logger.error(f"Bot {bot_id} not found or has no token")
                return

            try:
                bot_instance = create_bot(bot_data.token)
                dp = create_dispatcher()
                
                bot_info = await bot_instance.get_me()
                logger.info(f"Bot {bot_id} verified as @{bot_info.username}")

                task = asyncio.create_task(
                    dp.start_polling(bot_instance, handle_signals=False, polling_timeout=30)
                )
                
                self.active_bots[bot_id] = (task, bot_instance)
                logger.info(f"Bot {bot_id} polling started. Active bots: {list(self.active_bots.keys())}")
                
            except Exception as e:
                logger.error(f"Failed to start bot {bot_id}: {e}")
                import traceback
                traceback.print_exc()

    async def stop_bot(self, bot_id: int):
        entry = self.active_bots.get(bot_id)
        if entry:
            task, bot_instance = entry
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            # Close aiohttp session to prevent resource leak
            await bot_instance.session.close()
            del self.active_bots[bot_id]
            logger.info(f"Bot {bot_id} stopped")
        else:
            logger.warning(f"Bot {bot_id} is not running")

    async def start_all_active_bots(self):
        async with AsyncSessionLocal() as db:
            bots = await db.scalars(select(BotModel).where(BotModel.is_active == True))
            for bot in bots:
                await self.start_bot(bot.id)

bot_manager = BotManager()
