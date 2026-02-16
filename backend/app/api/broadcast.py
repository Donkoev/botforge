# backend/app/api/broadcast.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.broadcast import Broadcast
from app.schemas.broadcast import BroadcastCreate, BroadcastResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/broadcasts", tags=["broadcasts"])

@router.get("/", response_model=List[BroadcastResponse])
async def get_broadcasts(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Broadcast).order_by(Broadcast.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=BroadcastResponse)
async def create_broadcast(
    bc_in: BroadcastCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    new_bc = Broadcast(
        title=bc_in.title,
        text=bc_in.text,
        media_type=bc_in.media_type,
        media_file_id=bc_in.media_file_id,
        buttons=bc_in.buttons,
        target_bots=bc_in.target_bots,
        status="draft"
    )
    db.add(new_bc)
    await db.commit()
    await db.refresh(new_bc)
    return new_bc

@router.get("/{id}", response_model=BroadcastResponse)
async def get_broadcast(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Broadcast).where(Broadcast.id == id))
    bc = result.scalar_one_or_none()
    if not bc:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    return bc

@router.post("/{id}/start")
async def start_broadcast(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Broadcast).where(Broadcast.id == id))
    bc = result.scalar_one_or_none()
    if not bc:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    
    if bc.status != "draft":
        raise HTTPException(status_code=400, detail="Broadcast already started or completed")

    bc.status = "sending"
    # bc.started_at = datetime.utcnow() # handled in service
    await db.commit()
    
    # Trigger background service here
    # await broadcast_service.start_broadcast(id)
    
    return {"status": "started"}

@router.post("/{id}/cancel")
async def cancel_broadcast(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Broadcast).where(Broadcast.id == id))
    bc = result.scalar_one_or_none()
    if not bc:
        raise HTTPException(status_code=404, detail="Broadcast not found")

    if bc.status not in ["draft", "sending"]:
         raise HTTPException(status_code=400, detail="Cannot cancel completed broadcast")

    bc.status = "cancelled"
    await db.commit()
    return {"status": "cancelled"}
