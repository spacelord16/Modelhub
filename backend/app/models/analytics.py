from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PlatformAnalytics(Base):
    __tablename__ = "platform_analytics"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    total_users = Column(Integer, default=0)
    active_users_today = Column(Integer, default=0)
    total_models = Column(Integer, default=0)
    models_uploaded_today = Column(Integer, default=0)
    total_downloads = Column(Integer, default=0)
    downloads_today = Column(Integer, default=0)
    pending_approvals = Column(Integer, default=0)
    approved_models_today = Column(Integer, default=0)
    rejected_models_today = Column(Integer, default=0)
    emergency_disabled_count = Column(Integer, default=0)

    # Store additional metrics as JSON
    detailed_metrics = Column(JSON)

    def __repr__(self):
        return f"<PlatformAnalytics {self.date}>"


class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(String)  # login, upload, download, etc.
    activity_details = Column(JSON)  # Additional context
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<UserActivity {self.activity_type} by {self.user_id}>"


class ModelActivity(Base):
    __tablename__ = "model_activities"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"))
    activity_type = Column(String)  # download, view, like, etc.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    activity_details = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    model = relationship("Model")
    user = relationship("User")

    def __repr__(self):
        return f"<ModelActivity {self.activity_type} on {self.model_id}>"
