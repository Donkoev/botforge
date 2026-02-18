# backend/app/schemas/stats.py
from pydantic import BaseModel

class DailyStat(BaseModel):
    date: str
    count: int

class StatsOverview(BaseModel):
    total_users: int
    new_today: int
    new_week: int
    active_bots: int
