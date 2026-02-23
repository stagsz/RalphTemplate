"""Data API routes: file upload, data source listing, and table management."""

import os
import uuid as _uuid
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth import get_authenticated_user
from db import get_db
from models.user import User
from models.workspace import Workspace
from services.duckdb_service import drop_table, list_tables

DUCKDB_PATH = os.environ.get("DUCKDB_PATH", "/data/workspaces")

ALLOWED_EXTENSIONS = {".csv", ".json", ".parquet", ".xlsx", ".xls"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

router = APIRouter(prefix="/api/data", tags=["data"])


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    size: int
    content_type: str
    path: str

    model_config = {"from_attributes": True}


def _get_extension(filename: str) -> str:
    """Extract lowercase file extension from filename."""
    _, ext = os.path.splitext(filename)
    return ext.lower()


@router.post("/upload", response_model=UploadResponse, status_code=201)
def upload_file(
    workspace_id: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """Upload a data file (CSV, JSON, Parquet, Excel) to a workspace."""
    # Validate workspace exists and belongs to user
    try:
        ws_uuid = _uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Workspace not found")

    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == ws_uuid, Workspace.owner_id == user.id)
        .first()
    )
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Validate filename exists
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    # Validate file extension
    ext = _get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    # Read file content and validate size
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File too large. Maximum size is "
                f"{MAX_FILE_SIZE // (1024 * 1024)} MB"
            ),
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    # Save to workspace data directory
    file_id = str(_uuid.uuid4())
    upload_dir = os.path.join(
        DUCKDB_PATH, str(user.id), str(workspace.id), "uploads",
    )
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = f"{file_id}{ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        size=len(content),
        content_type=file.content_type or "application/octet-stream",
        path=file_path,
    )


# --- Response models for data sources ---


class ColumnInfo(BaseModel):
    name: str
    type: str
    duckdb_type: str

    model_config = {"from_attributes": True}


class DataSourceResponse(BaseModel):
    table_name: str
    columns: list[ColumnInfo]
    row_count: int

    model_config = {"from_attributes": True}


def _get_workspace_db_path(
    workspace_id: str,
    user: User,
    db: Session,
) -> str:
    """Validate workspace ownership and return its DuckDB path."""
    try:
        ws_uuid = _uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(
            status_code=404, detail="Workspace not found",
        )

    workspace = (
        db.query(Workspace)
        .filter(Workspace.id == ws_uuid, Workspace.owner_id == user.id)
        .first()
    )
    if workspace is None:
        raise HTTPException(
            status_code=404, detail="Workspace not found",
        )
    return str(workspace.duckdb_path)


@router.get("/sources", response_model=list[DataSourceResponse])
def get_sources(
    workspace_id: str = Query(...),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List all tables in a workspace DuckDB with schema info."""
    db_path = _get_workspace_db_path(workspace_id, user, db)

    if not os.path.isfile(db_path):
        return []

    try:
        return list_tables(db_path)
    except ValueError:
        return []


@router.delete("/sources/{table_name}", status_code=204)
def delete_source(
    table_name: str,
    workspace_id: str = Query(...),
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> None:
    """Drop a table from a workspace DuckDB database."""
    db_path = _get_workspace_db_path(workspace_id, user, db)

    if not os.path.isfile(db_path):
        raise HTTPException(
            status_code=404, detail="Table not found",
        )

    try:
        dropped = drop_table(db_path, table_name)
    except ValueError as e:
        raise HTTPException(
            status_code=400, detail=str(e),
        ) from e

    if not dropped:
        raise HTTPException(
            status_code=404, detail="Table not found",
        )
