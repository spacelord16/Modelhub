"""
Script to create a sample model for testing
"""

import os
import sqlite3
import json
import datetime

# Create SQLite database directory if it doesn't exist
os.makedirs("sqlite_db", exist_ok=True)
db_path = "sqlite_db/model_hub.db"

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create models table if it doesn't exist
cursor.execute(
    """
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    framework TEXT,
    version TEXT,
    format TEXT,
    size_mb REAL,
    s3_path TEXT,
    model_metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    owner_id INTEGER,
    downloads INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    average_rating REAL DEFAULT 0.0,
    task_type TEXT,
    tags TEXT,
    license TEXT,
    paper_url TEXT,
    github_url TEXT,
    performance_metrics TEXT,
    FOREIGN KEY (owner_id) REFERENCES users (id)
)
"""
)
conn.commit()

# Check if a sample model already exists
cursor.execute(
    "SELECT id FROM models WHERE name = 'Sample Model' AND version = '1.0.0'"
)
model = cursor.fetchone()

if model:
    print("Sample model already exists!")
else:
    # Insert a sample model
    now = datetime.datetime.now().isoformat()
    cursor.execute(
        """
    INSERT INTO models (
        name, description, framework, version, format, 
        size_mb, s3_path, model_metadata, created_at, 
        owner_id, task_type, tags, license
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (
            "Sample Model",  # name
            "A sample model for testing purposes",  # description
            "pytorch",  # framework
            "1.0.0",  # version
            "pt",  # format
            10.5,  # size_mb
            "samples/sample_model.pt",  # s3_path
            json.dumps(
                {"inputs": "image", "outputs": "classification"}
            ),  # model_metadata
            now,  # created_at
            1,  # owner_id (admin user)
            "classification",  # task_type
            json.dumps(["computer vision", "classification"]),  # tags
            "MIT",  # license
        ),
    )
    conn.commit()
    print("Sample model created successfully!")

# Close connection
conn.close()
