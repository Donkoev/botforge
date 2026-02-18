# backend/app/services/broadcast_service.py
import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select, update, func
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

            broadcast.started_at = datetime.now(timezone.utc)

            target_bots = broadcast.target_bots
            
            stmt = select(BotModel)
            if target_bots:
                 stmt = stmt.where(BotModel.id.in_(target_bots))
            
            bots = (await db.scalars(stmt)).all()

            # Count total users that will receive the broadcast
            count_query = select(func.count(BotUser.id)).where(BotUser.is_blocked == False)
            if target_bots:
                count_query = count_query.where(BotUser.source_bot_id.in_([b.id for b in bots]))
            broadcast.total_users = (await db.scalar(count_query)) or 0
            await db.commit()
            
            total_sent = 0
            total_failed = 0
            
            # Prepare buttons
            markup = None
            if broadcast.buttons:
                markup = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text=b['text'], url=b['url'])] for b in broadcast.buttons
                ])

            for bot_model in bots:
                try:
                    bot = Bot(token=bot_model.token)
                except Exception as e:
                    logger.error(f"Invalid token for bot {bot_model.id}: {e}")
                    continue

                users_result = await db.stream(
                    select(BotUser).where(
                        BotUser.source_bot_id == bot_model.id,
                        BotUser.is_blocked == False
                    )
                )
                
                async for user in users_result.scalars():
                    if broadcast.status == "cancelled":
                        break

                    try:
                        await self._send_message(bot, user.telegram_id, broadcast, markup)
                        total_sent += 1
                    except TelegramForbiddenError:
                        user.is_blocked = True
                        db.add(user)
                        total_failed += 1
                    except TelegramRetryAfter as e:
                        logger.warning(f"Flood limit exceeded. Sleep {e.retry_after}")
                        await asyncio.sleep(e.retry_after)
                        try:
                            await self._send_message(bot, user.telegram_id, broadcast, markup)
                            total_sent += 1
                        except Exception:
                            total_failed += 1
                    except Exception as e:
                        logger.error(f"Failed to send to {user.telegram_id}: {e}")
                        total_failed += 1
                    
                    # Periodic update every 10 users
                    if (total_sent + total_failed) % 10 == 0:
                        broadcast.sent_count = total_sent
                        broadcast.failed_count = total_failed
                        await db.commit()
                        await db.refresh(broadcast)
                        if broadcast.status == "cancelled":
                            break
                    
                    await asyncio.sleep(0.05)  # Rate limiting

                await bot.session.close()
                if broadcast.status == "cancelled":
                    break
            
            # Final update
            broadcast.sent_count = total_sent
            broadcast.failed_count = total_failed
            if broadcast.status != "cancelled":
                broadcast.status = "completed"
                broadcast.completed_at = datetime.now(timezone.utc)
            
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
