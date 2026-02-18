from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, bots, bot_users, messages, broadcast, stats
from app.config import settings
from app.database import engine, Base
from app import models
from app.services.bot_manager import bot_manager

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    MAX_RETRIES = 5
    RETRY_DELAY = 5
    
    for attempt in range(MAX_RETRIES):
        try:
            logger.info(f"Connecting to database (Attempt {attempt + 1}/{MAX_RETRIES})...")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created.")
            break
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            if attempt < MAX_RETRIES - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                await asyncio.sleep(RETRY_DELAY)
            else:
                logger.error("Could not connect to database after multiple attempts.")
    
    try:
        logger.info("Starting active bots...")
        await bot_manager.start_all_active_bots()
        logger.info("Active bots started.")
    except Exception as e:
         logger.error(f"Error starting bots: {e}")

    
    yield
    # Shutdown: stop all bots gracefully
    for bot_id in list(bot_manager.active_bots.keys()):
        await bot_manager.stop_bot(bot_id)

app = FastAPI(lifespan=lifespan, title="BotForge API")

# CORS — configure allowed origins (no wildcard in production)
origins = [
    "http://localhost:5173",
    "http://localhost:80",
    f"https://{settings.DOMAIN}",
    f"http://{settings.DOMAIN}",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(bots.router, prefix="/api")
app.include_router(bot_users.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(broadcast.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
