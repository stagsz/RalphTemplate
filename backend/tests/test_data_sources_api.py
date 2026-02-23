"""Tests for data source API routes.

Covers GET /api/data/sources and DELETE /api/data/sources/:name.
"""

import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import api.data as data_module
from db import get_db
from main import app
from models.base import Base
from services.duckdb_service import ingest_file

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


@pytest.fixture(autouse=True)
def _use_tmp_dir(
    tmp_path: object, monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Point DUCKDB_PATH to a temp folder for each test."""
    monkeypatch.setattr(data_module, "DUCKDB_PATH", str(tmp_path))


def _register_and_login(
    client: TestClient,
    email: str = "ralph@springfield.edu",
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


def _get_workspace(
    client: TestClient, token: str,
) -> tuple[str, str]:
    """Return (workspace_id, duckdb_path) for the default workspace."""
    resp = client.get(
        "/api/workspaces/", headers=_auth_headers(token),
    )
    ws = resp.json()[0]
    return ws["id"], ws["duckdb_path"]


def _create_csv(tmp_path: object, name: str = "sample.csv") -> str:
    """Write a simple CSV and return its absolute path."""
    path = os.path.join(str(tmp_path), name)
    with open(path, "w", encoding="utf-8") as f:
        f.write("id,name,score\n")
        f.write("1,Alice,95.5\n")
        f.write("2,Bob,87.0\n")
    return path


def _ingest_csv_into_workspace(
    tmp_path: object,
    db_path: str,
    table_name: str,
) -> None:
    """Create a CSV and ingest it into the workspace DuckDB."""
    csv_path = _create_csv(tmp_path, f"{table_name}.csv")
    ingest_file(db_path, csv_path, table_name)


# --- GET /api/data/sources: success cases ---


def test_list_sources_empty(client: TestClient) -> None:
    """Empty workspace returns empty list."""
    token = _register_and_login(client)
    ws_id, _ = _get_workspace(client, token)

    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_sources_with_tables(
    client: TestClient, tmp_path: object,
) -> None:
    """Lists tables after ingestion."""
    token = _register_and_login(client)
    ws_id, db_path = _get_workspace(client, token)

    _ingest_csv_into_workspace(tmp_path, db_path, "sales")

    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["table_name"] == "sales"
    assert data[0]["row_count"] == 2


def test_list_sources_multiple_tables(
    client: TestClient, tmp_path: object,
) -> None:
    """Lists multiple tables sorted by name."""
    token = _register_and_login(client)
    ws_id, db_path = _get_workspace(client, token)

    _ingest_csv_into_workspace(tmp_path, db_path, "zebra")
    _ingest_csv_into_workspace(tmp_path, db_path, "alpha")

    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    names = [t["table_name"] for t in data]
    assert names == ["alpha", "zebra"]


def test_list_sources_column_info(
    client: TestClient, tmp_path: object,
) -> None:
    """Response includes column metadata."""
    token = _register_and_login(client)
    ws_id, db_path = _get_workspace(client, token)

    _ingest_csv_into_workspace(tmp_path, db_path, "data")

    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    data = resp.json()
    cols = data[0]["columns"]
    assert len(cols) == 3
    for col in cols:
        assert "name" in col
        assert "type" in col
        assert "duckdb_type" in col


# --- GET /api/data/sources: auth & workspace errors ---


def test_list_sources_no_auth(client: TestClient) -> None:
    """Reject without authentication."""
    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": "some-id"},
    )
    assert resp.status_code == 422


def test_list_sources_invalid_token(client: TestClient) -> None:
    """Reject with invalid token."""
    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": "some-id"},
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert resp.status_code == 401


def test_list_sources_workspace_not_found(
    client: TestClient,
) -> None:
    """404 for non-existent workspace."""
    token = _register_and_login(client)
    resp = client.get(
        "/api/data/sources",
        params={
            "workspace_id": "00000000-0000-0000-0000-000000000000",
        },
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404


def test_list_sources_invalid_workspace_uuid(
    client: TestClient,
) -> None:
    """404 for invalid workspace UUID."""
    token = _register_and_login(client)
    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": "not-a-uuid"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404


def test_list_sources_other_users_workspace(
    client: TestClient,
) -> None:
    """Cannot list sources from another user's workspace."""
    token_a = _register_and_login(client, "owner@example.com")
    ws_id, _ = _get_workspace(client, token_a)

    token_b = _register_and_login(client, "intruder@example.com")

    resp = client.get(
        "/api/data/sources",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token_b),
    )
    assert resp.status_code == 404


def test_list_sources_missing_workspace_id(
    client: TestClient,
) -> None:
    """422 when workspace_id query param is missing."""
    token = _register_and_login(client)
    resp = client.get(
        "/api/data/sources",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 422


# --- DELETE /api/data/sources/:name: success cases ---


def test_delete_source_success(
    client: TestClient, tmp_path: object,
) -> None:
    """Drop a table from the workspace."""
    token = _register_and_login(client)
    ws_id, db_path = _get_workspace(client, token)

    _ingest_csv_into_workspace(tmp_path, db_path, "sales")

    resp = client.delete(
        "/api/data/sources/sales",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 204

    # Verify table is gone
    list_resp = client.get(
        "/api/data/sources",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert list_resp.json() == []


def test_delete_one_of_many(
    client: TestClient, tmp_path: object,
) -> None:
    """Drop one table, keep the other."""
    token = _register_and_login(client)
    ws_id, db_path = _get_workspace(client, token)

    _ingest_csv_into_workspace(tmp_path, db_path, "alpha")
    _ingest_csv_into_workspace(tmp_path, db_path, "beta")

    resp = client.delete(
        "/api/data/sources/alpha",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 204

    list_resp = client.get(
        "/api/data/sources",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    data = list_resp.json()
    assert len(data) == 1
    assert data[0]["table_name"] == "beta"


# --- DELETE /api/data/sources/:name: error cases ---


def test_delete_source_not_found(
    client: TestClient, tmp_path: object,
) -> None:
    """404 when table doesn't exist."""
    token = _register_and_login(client)
    ws_id, db_path = _get_workspace(client, token)

    # Create the db file so it exists but has no tables
    _ingest_csv_into_workspace(tmp_path, db_path, "other")

    resp = client.delete(
        "/api/data/sources/nonexistent",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_delete_source_no_db_file(
    client: TestClient,
) -> None:
    """404 when workspace DuckDB file doesn't exist yet."""
    token = _register_and_login(client)
    ws_id, _ = _get_workspace(client, token)

    resp = client.delete(
        "/api/data/sources/anything",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404


def test_delete_source_no_auth(client: TestClient) -> None:
    """Reject without authentication."""
    resp = client.delete(
        "/api/data/sources/sales",
        params={"workspace_id": "some-id"},
    )
    assert resp.status_code == 422


def test_delete_source_invalid_token(client: TestClient) -> None:
    """Reject with invalid token."""
    resp = client.delete(
        "/api/data/sources/sales",
        params={"workspace_id": "some-id"},
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert resp.status_code == 401


def test_delete_source_workspace_not_found(
    client: TestClient,
) -> None:
    """404 for non-existent workspace."""
    token = _register_and_login(client)
    resp = client.delete(
        "/api/data/sources/sales",
        params={
            "workspace_id": "00000000-0000-0000-0000-000000000000",
        },
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404


def test_delete_source_other_users_workspace(
    client: TestClient, tmp_path: object,
) -> None:
    """Cannot delete from another user's workspace."""
    token_a = _register_and_login(client, "owner@example.com")
    ws_id, db_path = _get_workspace(client, token_a)
    _ingest_csv_into_workspace(tmp_path, db_path, "sales")

    token_b = _register_and_login(client, "intruder@example.com")

    resp = client.delete(
        "/api/data/sources/sales",
        params={"workspace_id": ws_id},
        headers=_auth_headers(token_b),
    )
    assert resp.status_code == 404
