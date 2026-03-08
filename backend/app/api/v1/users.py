from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_superuser
from app.core.security import get_password_hash, verify_password, generate_api_key
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user."""
    return current_user


@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update own user."""
    user_data = user_in.model_dump(exclude_unset=True)

    if user_data.get("password"):
        user_data["hashed_password"] = get_password_hash(user_data["password"])
        del user_data["password"]

    for field, value in user_data.items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


# --- API Key endpoints ---
# IMPORTANT: These /me/* routes must stay ABOVE /{user_id}
# otherwise FastAPI will match "me" as a user_id and these
# endpoints will never be reached.

@router.post("/me/api-key")
def create_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate a new API key for the current user. Replaces any existing key."""
    current_user.api_key = generate_api_key()
    db.commit()
    db.refresh(current_user)
    return {"api_key": current_user.api_key}


@router.get("/me/api-key")
def get_api_key(
    current_user: User = Depends(get_current_active_user),
):
    """Get the current user's API key (masked for security)."""
    if not current_user.api_key:
        return {"api_key": None, "message": "No API key generated yet"}
    masked = current_user.api_key[:8] + "..." + current_user.api_key[-4:]
    return {"api_key": masked}


@router.delete("/me/api-key")
def revoke_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Revoke the current user's API key."""
    current_user.api_key = None
    db.commit()
    return {"message": "API key revoked"}


# --- General user endpoints (dynamic segments go LAST) ---

@router.get("/{user_id}", response_model=UserSchema)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get a specific user by id."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.id != user.id and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    return user


@router.get("/", response_model=List[UserSchema])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_superuser),
) -> Any:
    """Retrieve all users. Superusers only."""
    users = db.query(User).order_by(User.id).offset(skip).limit(limit).all()
    return users