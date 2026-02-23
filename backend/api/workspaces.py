"""Workspace API routes: list, create, delete workspaces."""

import os
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth import get_authenticated_user
from db import get_db
from models.user import User
from models.workspace import Workspace

DUCKDB_PATH = os.environ.get("DUCKDB_PATH", "/data/workspaces")

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


class CreateWorkspaceRequest(BaseModel):
    name: str


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    duckdb_path: str
    created_at: str

    model_config = {"from_attributes": True}


def _workspace_response(ws: Workspace) -> WorkspaceResponse:
    return WorkspaceResponse(
        id=str(ws.id),
        name=ws.name,
        duckdb_path=ws.duckdb_path,
        created_at=ws.created_at.isoformat() if ws.created_at else "",
    )


@router.get("/", response_model=list[WorkspaceResponse])
def list_workspaces(
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> list[WorkspaceResponse]:
    """List all workspaces for the authenticated user."""
    workspaces = (
        db.query(Workspace)
        .filter(Workspace.owner_id == user.id)
        .order_by(Workspace.created_at)
        .all()
    )
    return [_workspace_response(ws) for ws in workspaces]


@router.post("/", response_model=WorkspaceResponse, status_code=201)
def create_workspace(
    body: CreateWorkspaceRequest,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> WorkspaceResponse:
    """Create a new workspace for the authenticated user."""
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Workspace name cannot be empty")
    workspace = Workspace(
        name=body.name.strip(),
        owner_id=user.id,
        duckdb_path=(
            f"{DUCKDB_PATH}/{user.id}/"
            f"{body.name.strip().lower().replace(' ', '_')}.db"
        ),
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return _workspace_response(workspace)


@router.delete("/{workspace_id}", status_code=204)
def delete_workspace(
    workspace_id: str,
    user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a workspace owned by the authenticated user."""
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
    db.delete(workspace)
    db.commit()
