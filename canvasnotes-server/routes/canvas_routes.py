"""Canvas API routes — maps 1:1 to the requirements §7.3."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from models.schemas import (
    CanvasCreate,
    CanvasUpdate,
    CanvasDetail,
    CanvasListItem,
    CanvasResponse,
    CanvasLinkOut,
    LinkCreate,
    LinkResponse,
    SearchResult,
)
from services.canvas_service import CanvasService

router = APIRouter(prefix="/canvases", tags=["canvases"])


def _svc(db: AsyncSession) -> CanvasService:
    return CanvasService(db)


# ---------- Search (must be BEFORE /{id} to avoid path collision) ----------

@router.get("/search", response_model=list[SearchResult])
async def search_canvases(
    q: str = Query("", min_length=0),
    db: AsyncSession = Depends(get_db),
):
    """Search canvas titles for the [[wikilink]] popup."""
    svc = _svc(db)
    results = await svc.search(q)
    return [SearchResult.model_validate(c) for c in results]


# ---------- Canvas CRUD ----------

@router.get("", response_model=list[CanvasListItem])
async def list_canvases(db: AsyncSession = Depends(get_db)):
    svc = _svc(db)
    items = await svc.list_all()
    return items


@router.get("/tree")
async def get_canvas_tree(db: AsyncSession = Depends(get_db)):
    """Returns all canvases + link edges for the library sidebar tree view."""
    svc = _svc(db)
    return await svc.get_tree()


@router.post("", response_model=CanvasResponse, status_code=201)
async def create_canvas(
    body: CanvasCreate,
    db: AsyncSession = Depends(get_db),
):
    svc = _svc(db)
    canvas = await svc.create(title=body.title)
    return CanvasResponse.model_validate(canvas)


@router.get("/{canvas_id}", response_model=CanvasDetail)
async def get_canvas(
    canvas_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = _svc(db)
    canvas = await svc.get(canvas_id)
    if canvas is None:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return CanvasDetail(
        id=canvas.id,
        title=canvas.title,
        summary=canvas.summary,
        snapshot=canvas.snapshot,
        created_at=canvas.created_at,
        updated_at=canvas.updated_at,
        links=[
            CanvasLinkOut(target_id=lnk.target_canvas_id, shape_id=lnk.link_shape_id)
            for lnk in canvas.outgoing_links
        ],
    )


@router.patch("/{canvas_id}", response_model=CanvasResponse)
async def update_canvas(
    canvas_id: uuid.UUID,
    body: CanvasUpdate,
    db: AsyncSession = Depends(get_db),
):
    svc = _svc(db)
    canvas = await svc.update(
        canvas_id,
        title=body.title,
        summary=body.summary,
        snapshot=body.snapshot,
    )
    if canvas is None:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return CanvasResponse.model_validate(canvas)


@router.delete("/{canvas_id}", status_code=204)
async def delete_canvas(
    canvas_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = _svc(db)
    deleted = await svc.delete(canvas_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Canvas not found")
    return None


# ---------- Canvas Links ----------

@router.post("/{canvas_id}/links", response_model=LinkResponse, status_code=201)
async def create_link(
    canvas_id: uuid.UUID,
    body: LinkCreate,
    db: AsyncSession = Depends(get_db),
):
    svc = _svc(db)
    link = await svc.create_link(
        source_canvas_id=canvas_id,
        target_canvas_id=body.target_canvas_id,
        link_shape_id=body.link_shape_id,
    )
    return LinkResponse.model_validate(link)


@router.delete("/{canvas_id}/links/{shape_id}", status_code=204)
async def delete_link(
    canvas_id: uuid.UUID,
    shape_id: str,
    db: AsyncSession = Depends(get_db),
):
    svc = _svc(db)
    deleted = await svc.delete_link(canvas_id, shape_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Link not found")
    return None
