import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from models.base import Base
from models.user import User
from models.workspace import Workspace

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
TestSession = sessionmaker(bind=engine)


def _make_user(
    session: Session,
    email: str = "ralph@springfield.edu",
) -> User:
    user = User(
        email=email,
        password_hash="$2b$12$fakehashvalue",
        display_name="Ralph Wiggum",
    )
    session.add(user)
    session.flush()
    return user


def _make_workspace(
    session: Session,
    owner_id: uuid.UUID,
    name: str = "Default Workspace",
    duckdb_path: str = "/data/workspaces/test/default.db",
) -> Workspace:
    ws = Workspace(name=name, owner_id=owner_id, duckdb_path=duckdb_path)
    session.add(ws)
    session.flush()
    return ws


def test_workspace_table_exists() -> None:
    """The workspaces table is registered in Base metadata."""
    assert "workspaces" in Base.metadata.tables


def test_workspace_has_expected_columns() -> None:
    """The workspaces table has all required columns."""
    col_names = {c.name for c in Base.metadata.tables["workspaces"].columns}
    assert "id" in col_names
    assert "name" in col_names
    assert "owner_id" in col_names
    assert "duckdb_path" in col_names
    assert "created_at" in col_names
    assert "updated_at" in col_names


def test_workspace_id_is_uuid() -> None:
    """A new workspace gets an auto-generated UUID id."""
    session: Session = TestSession()
    try:
        user = _make_user(session)
        ws = _make_workspace(session, owner_id=user.id)
        assert isinstance(ws.id, uuid.UUID)
    finally:
        session.rollback()
        session.close()


def test_workspace_stores_name() -> None:
    """Workspace name is stored and retrievable."""
    session: Session = TestSession()
    try:
        user = _make_user(session)
        ws = _make_workspace(session, owner_id=user.id, name="My Workspace")
        assert ws.name == "My Workspace"
    finally:
        session.rollback()
        session.close()


def test_workspace_stores_owner_id() -> None:
    """Workspace owner_id references the user."""
    session: Session = TestSession()
    try:
        user = _make_user(session)
        ws = _make_workspace(session, owner_id=user.id)
        assert ws.owner_id == user.id
    finally:
        session.rollback()
        session.close()


def test_workspace_stores_duckdb_path() -> None:
    """Workspace duckdb_path is stored and retrievable."""
    session: Session = TestSession()
    try:
        user = _make_user(session)
        ws = _make_workspace(
            session, owner_id=user.id, duckdb_path="/data/workspaces/abc/default.db",
        )
        assert ws.duckdb_path == "/data/workspaces/abc/default.db"
    finally:
        session.rollback()
        session.close()


def test_two_workspaces_have_distinct_ids() -> None:
    """Each workspace receives a unique UUID."""
    session: Session = TestSession()
    try:
        user = _make_user(session)
        a = _make_workspace(session, owner_id=user.id, name="WS A")
        b = _make_workspace(session, owner_id=user.id, name="WS B")
        assert a.id != b.id
    finally:
        session.rollback()
        session.close()


def test_workspace_inherits_base_columns() -> None:
    """Workspace inherits id, created_at, updated_at from Base."""
    table = Base.metadata.tables["workspaces"]
    col_names = {c.name for c in table.columns}
    assert "id" in col_names
    assert "created_at" in col_names
    assert "updated_at" in col_names


def test_user_can_own_multiple_workspaces() -> None:
    """A single user can own multiple workspaces."""
    session: Session = TestSession()
    try:
        user = _make_user(session)
        ws1 = _make_workspace(session, owner_id=user.id, name="WS 1")
        ws2 = _make_workspace(session, owner_id=user.id, name="WS 2")
        results = (
            session.query(Workspace)
            .filter(Workspace.owner_id == user.id)
            .all()
        )
        assert len(results) == 2
        ids = {ws.id for ws in results}
        assert ws1.id in ids
        assert ws2.id in ids
    finally:
        session.rollback()
        session.close()
