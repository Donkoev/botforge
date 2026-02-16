# backend/app/services/broadcast_service.py
import asyncio
import logging
from datetime import datetime
from sqlalchemy import select, update
from aiogram import Bot
from aiogram.exceptions import TelegramRetryAfter, TelegramForbiddenError
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from app.database import AsyncSessionLocal
from app.models.broadcast import Broadcast
from app.models.bot import Bot as BotModel
from app.models.bot_user import BotUser

logger = logging.getLogger(__name__)

class BroadcastService:
    async def start_broadcast(self, broadcast_id: int):
        asyncio.create_task(self._run_broadcast(broadcast_id))

    async def _run_broadcast(self, broadcast_id: int):
        async with AsyncSessionLocal() as db:
            broadcast = await db.scalar(select(Broadcast).where(Broadcast.id == broadcast_id))
            if not broadcast:
                return

            broadcast.started_at = datetime.utcnow()
            await db.commit()

            target_bots = broadcast.target_bots
            # If target_bots is empty, select all active bots (or just all bots)
            # Logic: list of bot_ids. If empty list -> all bots.
            
            stmt = select(BotModel)
            if target_bots:
                 stmt = stmt.where(BotModel.id.in_(target_bots))
            
            bots = (await db.scalars(stmt)).all()
            
            total_sent = 0
            total_failed = 0
            
            # Prepare buttons
            markup = None
            if broadcast.buttons:
                markup = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text=b['text'], url=b['url'])] for b in broadcast.buttons
                ])

            for bot_model in bots:
                # We need an initialized bot instance. 
                # Ideally get from BotManager or create temporary
                try:
                    bot = Bot(token=bot_model.token)
                except Exception as e:
                    logger.error(f"Invalid token for bot {bot_model.id}: {e}")
                    continue

                # Get users for this bot
                # Filter blocked users
                users_stmt = select(BotUser).where(
                    BotUser.source_bot_id == bot_model.id,
                    BotUser.is_blocked == False
                )
                users = (await db.scalars(users_stmt)).all()

                for user in users:
                    if broadcast.status == "cancelled":
                         break

                    try:
                        await self._send_message(bot, user.telegram_id, broadcast, markup)
                        total_sent += 1
                        # Update stats in real-time or batch? 
                        # Real-time is heavy db load. Batching is better.
                        # For now, simplistic approach: update DB every N users or at end.
                        # Spec says "real-time", let's update simple counters in DB
                        # Optimization: increment defaults?
                        # Let's just update periodically in memory and flush to DB
                    except TelegramForbiddenError:
                        user.is_blocked = True
                        db.add(user) # Mark as blocked
                        total_failed += 1
                    except Exception as e:
                        logger.error(f"Failed to send to {user.telegram_id}: {e}")
                        total_failed += 1
                    
                    # Updates for simple progress tracking
                    # We might want to persist these counts
                    # To avoid DB lock, we'll update at end of bot loop or periodically
                    
                    await asyncio.sleep(0.05) # Rate limiting 20 msg/sec

                await bot.session.close()
            
            # Final update
            broadcast.sent_count = total_sent
            broadcast.failed_count = total_failed
            broadcast.status = "completed" if broadcast.status != "cancelled" else "cancelled"
            broadcast.completed_at = datetime.utcnow()
            await db.commit()

    async def _send_message(self, bot: Bot, chat_id: int, broadcast: Broadcast, markup):
        if broadcast.media_type == "photo" and broadcast.media_file_id:
            await bot.send_photo(chat_id, photo=broadcast.media_file_id, caption=broadcast.text, reply_markup=markup)
        elif broadcast.media_type == "video" and broadcast.media_file_id:
            await bot.send_video(chat_id, video=broadcast.media_file_id, caption=broadcast.text, reply_markup=markup)
        elif broadcast.media_type == "document" and broadcast.media_file_id:
            await bot.send_document(chat_id, document=broadcast.media_file_id, caption=broadcast.text, reply_markup=markup)
        elif broadcast.media_type == "animation" and broadcast.media_file_id:
             await bot.send_animation(chat_id, animation=broadcast.media_file_id, caption=broadcast.text, reply_markup=markup)
        elif broadcast.text:
            await bot.send_message(chat_id, text=broadcast.text, reply_markup=markup) 

broadcast_service = BroadcastService()
