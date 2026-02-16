# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, bots, bot_users, messages, broadcast, stats
from app.config import settings
from app.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app import models
from app.services.bot_manager import bot_manager

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Startup: Create tables if they don't exist
        logger.info("Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created.")
        
        # Startup: Start all active bots
        logger.info("Starting active bots...")
        await bot_manager.start_all_active_bots()
        logger.info("Active bots started.")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        # We don't raise here to allow the app to start even if DB/Bots fail
    
    yield
    # Shutdown: Stop all bots (optional, as tasks are cancelled on loop exit usually)
    # await bot_manager.stop_all()

app = FastAPI(lifespan=lifespan, title="BotForge API")

# CORS
origins = [
    "http://localhost:5173",
    "http://localhost:80",
    "https://" + settings.DOMAIN,
    f"http://{settings.DOMAIN}",
    "*" # For dev convenience, tighten in prod
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
