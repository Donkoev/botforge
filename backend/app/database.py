# backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Создаем асинхронный движок SQLAlchemy
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# Фабрика сессий
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Базовый класс для всех моделей
class Base(DeclarativeBase):
    pass

# Dependecy для использования в FastAPI endpoint'ах
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
