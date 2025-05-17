import os
import shutil
from fastapi import UploadFile
from typing import Tuple
import uuid
import aiofiles

from app.core.config import settings

# For now, this is a simple file storage implementation
# In production, you would use S3 or similar cloud storage


async def save_uploaded_file(file: UploadFile, user_id: int) -> Tuple[str, float]:
    """
    Asynchronously save an uploaded file to local storage (mock S3)

    Returns:
        Tuple[str, float]: (file path, size in MB)
    """
    # Create a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create user directory if it doesn't exist
    storage_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(storage_dir, exist_ok=True)

    # Save file path
    file_path = os.path.join(storage_dir, unique_filename)

    # Save the file asynchronously
    async with aiofiles.open(file_path, "wb") as buffer:
        # Read and write in chunks to avoid loading entire file into memory
        chunk_size = 1024 * 1024  # 1MB chunks
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            await buffer.write(chunk)

    # Get file size in MB
    size_mb = os.path.getsize(file_path) / (1024 * 1024)

    # Return the S3-style path and size
    s3_style_path = f"models/{user_id}/{unique_filename}"

    return s3_style_path, size_mb


def get_download_url(s3_path: str) -> str:
    """
    Get a download URL for a file

    In a real implementation, this would generate a pre-signed S3 URL
    """
    return f"{settings.API_V1_STR}/downloads/{s3_path}"
