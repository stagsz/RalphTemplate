"""Tests for the authentication service."""

import uuid
from collections.abc import Generator
from datetime import timedelta
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from models.base import Base
from services.auth_service import (
    authenticate_user,
    create_access_token,
    decode_token,
    get_current_user,
    hash_password,
    register_user,
    verify_password,
)

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine)
TestSession = sessionmaker(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Provide a clean database session per test."""
    session = TestSession()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# --- Password hashing ---


def test_hash_password_returns_bcrypt_hash() -> None:
    hashed = hash_password("secret123")
    assert hashed.startswith("$2b$")


def test_hash_password_different_each_call() -> None:
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert h1 != h2  # different salts


def test_verify_password_correct() -> None:
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed) is True


def test_verify_password_wrong() -> None:
    hashed = hash_password("mypassword")
    assert verify_password("wrongpassword", hashed) is False


# --- JWT tokens ---


def test_create_and_decode_token() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    decoded_id = decode_token(token)
    assert decoded_id == user_id


def test_create_token_custom_expiry() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id, expires_delta=timedelta(hours=2))
    decoded_id = decode_token(token)
    assert decoded_id == user_id


def test_decode_token_expired() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id, expires_delta=timedelta(seconds=-1))
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token(token)


def test_decode_token_invalid_string() -> None:
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token("not.a.valid.jwt")


def test_decode_token_wrong_secret() -> None:
    from jose import jwt as jose_jwt

    token = jose_jwt.encode(
        {"sub": str(uuid.uuid4())}, "wrong-secret", algorithm="HS256"
    )
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token(token)


def test_decode_token_missing_sub() -> None:
    from jose import jwt as jose_jwt

    from services.auth_service import JWT_ALGORITHM, JWT_SECRET

    token = jose_jwt.encode({"data": "no-sub"}, JWT_SECRET, algorithm=JWT_ALGORITHM)
    with pytest.raises(ValueError, match="missing subject"):
        decode_token(token)


def test_decode_token_invalid_uuid_sub() -> None:
    from jose import jwt as jose_jwt

    from services.auth_service import JWT_ALGORITHM, JWT_SECRET

    token = jose_jwt.encode(
        {"sub": "not-a-uuid"}, JWT_SECRET, algorithm=JWT_ALGORITHM
    )
    with pytest.raises(ValueError, match="Invalid user ID"):
        decode_token(token)


# --- register_user ---


def test_register_user_creates_user(db: Session) -> None:
    user = register_user("ralph@springfield.edu", "password123", "Ralph Wiggum", db)
    assert user.email == "ralph@springfield.edu"
    assert user.display_name == "Ralph Wiggum"
    assert user.password_hash != "password123"
    assert isinstance(user.id, uuid.UUID)


def test_register_user_hashes_password(db: Session) -> None:
    user = register_user("test@example.com", "secret", "Test User", db)
    assert verify_password("secret", user.password_hash)


def test_register_user_duplicate_email(db: Session) -> None:
    register_user("dupe@example.com", "pass1", "User One", db)
    with pytest.raises(ValueError, match="Email already registered"):
        register_user("dupe@example.com", "pass2", "User Two", db)


# --- authenticate_user ---


def test_authenticate_user_returns_token(db: Session) -> None:
    register_user("login@example.com", "correct_password", "Login User", db)
    token = authenticate_user("login@example.com", "correct_password", db)
    assert isinstance(token, str)
    # Token should be decodable
    user_id = decode_token(token)
    assert isinstance(user_id, uuid.UUID)


def test_authenticate_user_wrong_password(db: Session) -> None:
    register_user("auth@example.com", "right", "Auth User", db)
    with pytest.raises(ValueError, match="Invalid email or password"):
        authenticate_user("auth@example.com", "wrong", db)


def test_authenticate_user_unknown_email(db: Session) -> None:
    with pytest.raises(ValueError, match="Invalid email or password"):
        authenticate_user("nobody@example.com", "anything", db)


# --- get_current_user ---


def test_get_current_user_returns_user(db: Session) -> None:
    user = register_user("current@example.com", "pass", "Current User", db)
    token = create_access_token(user.id)
    found = get_current_user(token, db)
    assert found.id == user.id
    assert found.email == "current@example.com"


def test_get_current_user_invalid_token(db: Session) -> None:
    with pytest.raises(ValueError, match="Invalid token"):
        get_current_user("bad-token", db)


def test_get_current_user_deleted_user(db: Session) -> None:
    fake_id = uuid.uuid4()
    token = create_access_token(fake_id)
    with pytest.raises(ValueError, match="User not found"):
        get_current_user(token, db)


# --- JWT_EXPIRY_MINUTES config ---


def test_jwt_expiry_configurable() -> None:
    with patch.dict("os.environ", {"JWT_EXPIRY_MINUTES": "120"}):
        # Re-import to pick up the patched value
        import importlib

        import services.auth_service as mod

        importlib.reload(mod)
        assert mod.JWT_EXPIRY_MINUTES == 120
        # Restore
        importlib.reload(mod)
