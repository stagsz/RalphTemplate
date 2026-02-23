"""Tests for workspace API routes.

Covers GET /workspaces, POST /workspaces, DELETE /workspaces/:id.
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from db import get_db
from main import app
from models.base import Base

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(engine)
TestSession = sessionmaker(bind=engine)


@pytest.fixture(autouse=True)
def _override_db() -> Generator[None, None, None]:
    """Override get_db with in-memory SQLite; reset tables each test."""
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    def override() -> Generator[Session, None, None]:
        session = TestSession()
        try:
            yield session
        finally:
            session.rollback()
            session.close()

    app.dependency_overrides[get_db] = override
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _register_and_login(
    client: TestClient, email: str = "ralph@springfield.edu",
) -> str:
    """Register a user (creates default workspace) and return token."""
    client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "password123",
            "display_name": "Ralph Wiggum",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": "password123"},
    )
    token: str = resp.json()["access_token"]
    return token


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# --- GET /api/workspaces/ ---


def test_list_workspaces_returns_default(client: TestClient) -> None:
    """New user should have a Default Workspace from registration."""
    token = _register_and_login(client)
    resp = client.get("/api/workspaces/", headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Default Workspace"
    assert "id" in data[0]
    assert "duckdb_path" in data[0]
    assert "created_at" in data[0]


def test_list_workspaces_scoped_to_user(client: TestClient) -> None:
    """Each user only sees their own workspaces."""
    token_a = _register_and_login(client, "user_a@example.com")
    token_b = _register_and_login(client, "user_b@example.com")

    # User A creates an extra workspace
    client.post(
        "/api/workspaces/",
        json={"name": "User A Project"},
        headers=_auth_headers(token_a),
    )

    # User A sees 2 workspaces
    resp_a = client.get("/api/workspaces/", headers=_auth_headers(token_a))
    assert len(resp_a.json()) == 2

    # User B sees only 1 (default)
    resp_b = client.get("/api/workspaces/", headers=_auth_headers(token_b))
    assert len(resp_b.json()) == 1


def test_list_workspaces_no_auth(client: TestClient) -> None:
    resp = client.get("/api/workspaces/")
    assert resp.status_code == 422


def test_list_workspaces_invalid_token(client: TestClient) -> None:
    resp = client.get(
        "/api/workspaces/",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert resp.status_code == 401


# --- POST /api/workspaces/ ---


def test_create_workspace_success(client: TestClient) -> None:
    token = _register_and_login(client)
    resp = client.post(
        "/api/workspaces/",
        json={"name": "Analytics Project"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Analytics Project"
    assert "id" in data
    assert "duckdb_path" in data
    assert "analytics_project" in data["duckdb_path"]


def test_create_workspace_strips_whitespace(client: TestClient) -> None:
    token = _register_and_login(client)
    resp = client.post(
        "/api/workspaces/",
        json={"name": "  Trimmed Name  "},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Trimmed Name"


def test_create_workspace_empty_name(client: TestClient) -> None:
    token = _register_and_login(client)
    resp = client.post(
        "/api/workspaces/",
        json={"name": "   "},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()


def test_create_workspace_missing_name(client: TestClient) -> None:
    token = _register_and_login(client)
    resp = client.post(
        "/api/workspaces/",
        json={},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 422


def test_create_workspace_no_auth(client: TestClient) -> None:
    resp = client.post("/api/workspaces/", json={"name": "Test"})
    assert resp.status_code == 422


def test_create_workspace_appears_in_list(client: TestClient) -> None:
    token = _register_and_login(client)
    client.post(
        "/api/workspaces/",
        json={"name": "New Project"},
        headers=_auth_headers(token),
    )
    resp = client.get("/api/workspaces/", headers=_auth_headers(token))
    names = [ws["name"] for ws in resp.json()]
    assert "Default Workspace" in names
    assert "New Project" in names
    assert len(names) == 2


# --- DELETE /api/workspaces/:id ---


def test_delete_workspace_success(client: TestClient) -> None:
    token = _register_and_login(client)
    # Create a workspace to delete
    create_resp = client.post(
        "/api/workspaces/",
        json={"name": "To Delete"},
        headers=_auth_headers(token),
    )
    ws_id = create_resp.json()["id"]

    resp = client.delete(
        f"/api/workspaces/{ws_id}",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 204

    # Verify it's gone
    list_resp = client.get("/api/workspaces/", headers=_auth_headers(token))
    ids = [ws["id"] for ws in list_resp.json()]
    assert ws_id not in ids


def test_delete_workspace_not_found(client: TestClient) -> None:
    token = _register_and_login(client)
    resp = client.delete(
        "/api/workspaces/00000000-0000-0000-0000-000000000000",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_delete_workspace_other_user(client: TestClient) -> None:
    """A user cannot delete another user's workspace."""
    token_a = _register_and_login(client, "owner@example.com")
    token_b = _register_and_login(client, "intruder@example.com")

    # Get user A's default workspace
    resp = client.get("/api/workspaces/", headers=_auth_headers(token_a))
    ws_id = resp.json()[0]["id"]

    # User B tries to delete it
    resp = client.delete(
        f"/api/workspaces/{ws_id}",
        headers=_auth_headers(token_b),
    )
    assert resp.status_code == 404

    # Verify it still exists for user A
    resp = client.get("/api/workspaces/", headers=_auth_headers(token_a))
    assert len(resp.json()) == 1


def test_delete_workspace_no_auth(client: TestClient) -> None:
    resp = client.delete("/api/workspaces/some-id")
    assert resp.status_code == 422


def test_delete_workspace_invalid_token(client: TestClient) -> None:
    resp = client.delete(
        "/api/workspaces/some-id",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert resp.status_code == 401
