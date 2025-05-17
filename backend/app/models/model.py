from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    framework = Column(String)  # pytorch, tensorflow, onnx, etc.
    version = Column(String)
    format = Column(String)  # saved_model, pt, pth, onnx, etc.
    size_mb = Column(Float)
    s3_path = Column(String)  # Path to model files in S3
    model_metadata = Column(JSON)  # Additional model metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="models")

    # Model metrics
    downloads = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)

    # Model card information
    task_type = Column(String)  # classification, detection, etc.
    tags = Column(JSON)  # List of tags
    license = Column(String)
    paper_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)

    # Performance metrics
    performance_metrics = Column(JSON)  # Store benchmark results

    def __repr__(self):
        return f"<Model {self.name} v{self.version}>"
