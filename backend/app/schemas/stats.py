# backend/app/schemas/stats.py
from pydantic import BaseModel
from typing import List

class StatItem(BaseModel):
    label: str
    value: int

class DailyStat(BaseModel):
    date: str
    count: int

class StatsOverview(BaseModel):
    total_users: int
    new_today: int
    new_week: int
    active_bots: int

class BotStats(BaseModel):
    bot_name: str
    user_count: int
    percentage: float
