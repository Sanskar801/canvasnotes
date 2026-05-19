"""Pydantic request / response schemas for the Canvas API."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Canvas
# ---------------------------------------------------------------------------

class CanvasCreate(BaseModel):
    title: str = "Untitled canvas"


class CanvasUpdate(BaseModel):
    title: str | None = None
    summary: str | None = None
    snapshot: dict[str, Any] | None = None


class CanvasLinkOut(BaseModel):
    target_id: uuid.UUID
    shape_id: str

    model_config = {"from_attributes": True}


class CanvasListItem(BaseModel):
    id: uuid.UUID
    title: str
    summary: str | None
    updated_at: datetime
    child_count: int = 0

    model_config = {"from_attributes": True}


class CanvasDetail(BaseModel):
    id: uuid.UUID
    title: str
    summary: str | None
    snapshot: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    links: list[CanvasLinkOut] = []

    model_config = {"from_attributes": True}


class CanvasResponse(BaseModel):
    id: uuid.UUID
    title: str
    summary: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Canvas Link
# ---------------------------------------------------------------------------

class LinkCreate(BaseModel):
    target_canvas_id: uuid.UUID
    link_shape_id: str


class LinkResponse(BaseModel):
    id: uuid.UUID
    source_canvas_id: uuid.UUID
    target_canvas_id: uuid.UUID
    link_shape_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

class SearchResult(BaseModel):
    id: uuid.UUID
    title: str
    summary: str | None

    model_config = {"from_attributes": True}
