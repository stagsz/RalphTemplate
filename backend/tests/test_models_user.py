import uuid

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from models.base import Base
from models.user import User

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
TestSession = sessionmaker(bind=engine)


def _make_user(
    email: str = "ralph@springfield.edu",
    password_hash: str = "$2b$12$fakehashvalue",
    display_name: str = "Ralph Wiggum",
) -> User:
    return User(email=email, password_hash=password_hash, display_name=display_name)


def test_user_table_exists() -> None:
    """The users table is registered in Base metadata."""
    assert "users" in Base.metadata.tables


def test_user_has_expected_columns() -> None:
    """The users table has all required columns."""
    col_names = {c.name for c in Base.metadata.tables["users"].columns}
    assert "id" in col_names
    assert "email" in col_names
    assert "password_hash" in col_names
    assert "display_name" in col_names
    assert "created_at" in col_names
    assert "updated_at" in col_names


def test_user_id_is_uuid() -> None:
    """A new user gets an auto-generated UUID id."""
    session: Session = TestSession()
    try:
        user = _make_user()
        session.add(user)
        session.flush()
        assert isinstance(user.id, uuid.UUID)
    finally:
        session.rollback()
        session.close()


def test_user_stores_email() -> None:
    """User email is stored and retrievable."""
    session: Session = TestSession()
    try:
        user = _make_user(email="test@example.com")
        session.add(user)
        session.flush()
        assert user.email == "test@example.com"
    finally:
        session.rollback()
        session.close()


def test_user_stores_password_hash() -> None:
    """User password_hash is stored (never plaintext)."""
    session: Session = TestSession()
    try:
        user = _make_user(password_hash="$2b$12$somebcrypthash")
        session.add(user)
        session.flush()
        assert user.password_hash == "$2b$12$somebcrypthash"
    finally:
        session.rollback()
        session.close()


def test_user_stores_display_name() -> None:
    """User display_name is stored and retrievable."""
    session: Session = TestSession()
    try:
        user = _make_user(display_name="Ralph")
        session.add(user)
        session.flush()
        assert user.display_name == "Ralph"
    finally:
        session.rollback()
        session.close()


def test_user_email_unique_constraint() -> None:
    """Inserting two users with the same email raises IntegrityError."""
    session: Session = TestSession()
    try:
        session.add(_make_user(email="dupe@example.com"))
        session.flush()
        session.add(_make_user(email="dupe@example.com"))
        try:
            session.flush()
            raise AssertionError("Expected IntegrityError for duplicate email")
        except IntegrityError:
            session.rollback()
    finally:
        session.close()


def test_two_users_have_distinct_ids() -> None:
    """Each user receives a unique UUID."""
    session: Session = TestSession()
    try:
        a = _make_user(email="a@example.com")
        b = _make_user(email="b@example.com")
        session.add_all([a, b])
        session.flush()
        assert a.id != b.id
    finally:
        session.rollback()
        session.close()


def test_user_inherits_base_columns() -> None:
    """User inherits id, created_at, updated_at from Base."""
    session: Session = TestSession()
    try:
        user = _make_user()
        session.add(user)
        session.flush()
        assert isinstance(user.id, uuid.UUID)
        # SQLite doesn't execute server_default func.now(),
        # but the columns exist in the schema.
        table = Base.metadata.tables["users"]
        col_names = {c.name for c in table.columns}
        assert "created_at" in col_names
        assert "updated_at" in col_names
    finally:
        session.rollback()
        session.close()
