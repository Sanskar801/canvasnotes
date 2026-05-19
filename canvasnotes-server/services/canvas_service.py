"""Business-logic layer for canvas CRUD and link management."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Sequence

from sqlalchemy import select, func, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models import Canvas, CanvasLink


class CanvasService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Canvas CRUD
    # ------------------------------------------------------------------

    async def create(self, title: str = "Untitled canvas") -> Canvas:
        canvas = Canvas(title=title)
        self.db.add(canvas)
        await self.db.commit()
        await self.db.refresh(canvas)
        return canvas

    async def get(self, canvas_id: uuid.UUID) -> Canvas | None:
        stmt = (
            select(Canvas)
            .options(selectinload(Canvas.outgoing_links))
            .where(Canvas.id == canvas_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[dict[str, Any]]:
        """Return all canvases with a child_count (number of outgoing links)."""
        stmt = (
            select(
                Canvas.id,
                Canvas.title,
                Canvas.summary,
                Canvas.updated_at,
                func.count(CanvasLink.id).label("child_count"),
            )
            .outerjoin(CanvasLink, Canvas.id == CanvasLink.source_canvas_id)
            .group_by(Canvas.id)
            .order_by(Canvas.updated_at.desc())
        )
        rows = await self.db.execute(stmt)
        return [
            {
                "id": r.id,
                "title": r.title,
                "summary": r.summary,
                "updated_at": r.updated_at,
                "child_count": r.child_count,
            }
            for r in rows.all()
        ]

    async def update(
        self,
        canvas_id: uuid.UUID,
        *,
        title: str | None = None,
        summary: str | None = None,
        snapshot: dict[str, Any] | None = None,
    ) -> Canvas | None:
        canvas = await self.get(canvas_id)
        if canvas is None:
            return None
        if title is not None:
            canvas.title = title
        if summary is not None:
            canvas.summary = summary
        if snapshot is not None:
            canvas.snapshot = snapshot
        canvas.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(canvas)
        return canvas

    async def delete(self, canvas_id: uuid.UUID) -> bool:
        canvas = await self.get(canvas_id)
        if canvas is None:
            return False
        # Delete all link rows where this canvas is source OR target
        await self.db.execute(
            delete(CanvasLink).where(
                or_(
                    CanvasLink.source_canvas_id == canvas_id,
                    CanvasLink.target_canvas_id == canvas_id,
                )
            )
        )
        await self.db.delete(canvas)
        await self.db.commit()
        return True

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    async def search(self, query: str, limit: int = 10) -> Sequence[Canvas]:
        stmt = (
            select(Canvas)
            .where(Canvas.title.ilike(f"%{query}%"))
            .order_by(Canvas.updated_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    # ------------------------------------------------------------------
    # Links
    # ------------------------------------------------------------------

    async def create_link(
        self,
        source_canvas_id: uuid.UUID,
        target_canvas_id: uuid.UUID,
        link_shape_id: str,
    ) -> CanvasLink:
        link = CanvasLink(
            source_canvas_id=source_canvas_id,
            target_canvas_id=target_canvas_id,
            link_shape_id=link_shape_id,
        )
        self.db.add(link)
        await self.db.commit()
        await self.db.refresh(link)
        return link

    async def delete_link(
        self, source_canvas_id: uuid.UUID, link_shape_id: str
    ) -> bool:
        stmt = delete(CanvasLink).where(
            CanvasLink.source_canvas_id == source_canvas_id,
            CanvasLink.link_shape_id == link_shape_id,
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    # ------------------------------------------------------------------
    # Hierarchy helpers (for library tree view)
    # ------------------------------------------------------------------

    async def get_tree(self) -> list[dict[str, Any]]:
        """Return all canvases + link edges so the frontend can build a tree."""
        canvases = await self.list_all()
        links_stmt = select(CanvasLink.source_canvas_id, CanvasLink.target_canvas_id)
        link_rows = await self.db.execute(links_stmt)
        edges = [
            {"source": str(r.source_canvas_id), "target": str(r.target_canvas_id)}
            for r in link_rows.all()
        ]
        return {"canvases": canvases, "edges": edges}
