from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Deep Learning Model Hub"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = (
        os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:3000,http://localhost:8000,http://localhost:3001,https://modelhub-pink.vercel.app,https://modelhub.whoretard.uk",
        ).split(",")
        if os.getenv("BACKEND_CORS_ORIGINS")
        else [
            "http://localhost:3000",  # React frontend
            "http://localhost:8000",  # Backend
            "http://localhost:3001",  # Next.js frontend alternate port
            "https://modelhub-pink.vercel.app",  # Production frontend on Vercel
            "https://modelhub.whoretard.uk",  # Production backend domain
        ]
    )

    # Database
    USE_SQLITE: bool = (
        os.getenv("USE_SQLITE", "true").lower() == "true"
    )  # Check env var properly
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "modelhub")
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    # AWS Settings
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "modelhub-models")

    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    # Model Settings
    SUPPORTED_MODEL_FORMATS: List[str] = [
        "pytorch",
        "tensorflow",
        "onnx",
        "huggingface",
    ]

    # Inference Settings
    MAX_INFERENCE_TIME: int = 30  # seconds
    MAX_BATCH_SIZE: int = 32

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Use DATABASE_URL if available (Railway standard), otherwise construct from components
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            self.SQLALCHEMY_DATABASE_URI = database_url
        else:
            self.SQLALCHEMY_DATABASE_URI = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
            )


settings = Settings()
