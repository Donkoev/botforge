# backend/app/services/bot_manager.py
import asyncio
import logging
from typing import Dict
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
            cls._instance.active_bots: Dict[int, asyncio.Task] = {}
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
                # Initialize aiogram bot and dispatcher
                # We need to import handlers inside factory or here to register them
                bot_instance = create_bot(bot_data.token)
                dp = create_dispatcher()
                
                # Verify identity
                bot_info = await bot_instance.get_me()
                logger.info(f"Bot {bot_id} verified as @{bot_info.username} (ID: {bot_info.id})")

                # Start polling in a separate task
                # Important: handle_signals=False is crucial when running multiple bots 
                task = asyncio.create_task(
                    dp.start_polling(bot_instance, handle_signals=False, polling_timeout=30)
                )
                
                self.active_bots[bot_id] = task
                logger.info(f"Bot {bot_id} (Tasks: {list(self.active_bots.keys())}) polling started.")
                
            except Exception as e:
                logger.error(f"Failed to start bot {bot_id}: {e}")
                import traceback
                traceback.print_exc()

    async def stop_bot(self, bot_id: int):
        task = self.active_bots.get(bot_id)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
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
