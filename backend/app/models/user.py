from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(enum.Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    last_login = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    models = relationship(
        "Model", back_populates="owner", foreign_keys="Model.owner_id"
    )

    def __repr__(self):
        return f"<User {self.username}>"

    def has_admin_access(self):
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] or self.is_superuser

    def can_moderate(self):
        return (
            self.role in [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]
            or self.is_superuser
        )
