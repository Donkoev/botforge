# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, bots, bot_users, messages, broadcast, stats
from app.config import settings
from app.services.bot_manager import bot_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start all active bots
    await bot_manager.start_all_active_bots()
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
