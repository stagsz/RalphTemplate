import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Workspace(Base):
    """Workspace containing DuckDB analytical data for a user."""

    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    duckdb_path: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
    )
