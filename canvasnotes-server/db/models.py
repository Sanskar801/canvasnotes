import uuid
from datetime import datetime, timezone

from sqlalchemy import Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Canvas(Base):
    __tablename__ = "canvases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(Text, nullable=False, default="Untitled canvas")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Links going OUT from this canvas (this canvas is the source / parent)
    outgoing_links: Mapped[list["CanvasLink"]] = relationship(
        "CanvasLink",
        foreign_keys="CanvasLink.source_canvas_id",
        back_populates="source_canvas",
        cascade="all, delete-orphan",
    )
    # Links coming IN to this canvas (this canvas is the target / child)
    incoming_links: Mapped[list["CanvasLink"]] = relationship(
        "CanvasLink",
        foreign_keys="CanvasLink.target_canvas_id",
        back_populates="target_canvas",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Canvas id={self.id} title={self.title!r}>"


class CanvasLink(Base):
    __tablename__ = "canvas_links"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source_canvas_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("canvases.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_canvas_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("canvases.id", ondelete="CASCADE"),
        nullable=False,
    )
    link_shape_id: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    source_canvas: Mapped["Canvas"] = relationship(
        "Canvas",
        foreign_keys=[source_canvas_id],
        back_populates="outgoing_links",
    )
    target_canvas: Mapped["Canvas"] = relationship(
        "Canvas",
        foreign_keys=[target_canvas_id],
        back_populates="incoming_links",
    )

    def __repr__(self) -> str:
        return f"<CanvasLink {self.source_canvas_id} -> {self.target_canvas_id}>"
