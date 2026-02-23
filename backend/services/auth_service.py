"""Authentication service: password hashing, JWT tokens, user registration/login."""

import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from models.user import User

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-to-a-random-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = int(os.environ.get("JWT_EXPIRY_MINUTES", "60"))


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(
    user_id: uuid.UUID,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token for the given user ID."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=JWT_EXPIRY_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> uuid.UUID:
    """Decode a JWT token and return the user ID.

    Raises ValueError if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e
    sub = payload.get("sub")
    if sub is None:
        raise ValueError("Token missing subject claim")
    try:
        return uuid.UUID(sub)
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Invalid user ID in token: {e}") from e


def register_user(
    email: str,
    password: str,
    display_name: str,
    db: Session,
) -> User:
    """Register a new user. Raises ValueError if email already taken."""
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise ValueError("Email already registered")
    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(email: str, password: str, db: Session) -> str:
    """Verify credentials and return a JWT access token.

    Raises ValueError if credentials are invalid.
    """
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")
    return create_access_token(user.id)


def get_current_user(token: str, db: Session) -> User:
    """Decode a JWT token and return the corresponding User.

    Raises ValueError if the token is invalid or the user doesn't exist.
    """
    user_id = decode_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise ValueError("User not found")
    return user
