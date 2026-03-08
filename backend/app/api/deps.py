from typing import Generator, Optional

from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


# Database dependency
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Current user dependency
def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


# Current active user dependency
def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


# Current superuser dependency
def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


def get_current_user_by_api_key(
    api_key: str = Security(api_key_header),
    db: Session = Depends(get_db),
) -> User:
    if not api_key:
        raise HTTPException(status_code=401, detail="API key is required")
    user = db.query(User).filter(User.api_key == api_key).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def get_user_from_token_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Try JWT auth, return None if missing/invalid (does not raise)."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        return None
    return db.query(User).filter(User.id == token_data.sub).first()


def get_user_from_api_key_optional(
    api_key: Optional[str] = Security(api_key_header),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Try API key auth, return None if missing/invalid (does not raise)."""
    if not api_key:
        return None
    return db.query(User).filter(User.api_key == api_key).first()


def get_user_jwt_or_api_key(
    jwt_user: Optional[User] = Depends(get_user_from_token_optional),
    api_key_user: Optional[User] = Depends(get_user_from_api_key_optional),
) -> User:
    """Accept either a JWT Bearer token OR an X-API-Key header. Raises 401 if neither."""
    user = jwt_user or api_key_user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: provide a Bearer token or X-API-Key",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user
