"""
Simplified script to create admin user directly using SQLite
"""

import os
import sqlite3
from passlib.context import CryptContext

# Create SQLite database directory if it doesn't exist
os.makedirs("sqlite_db", exist_ok=True)
db_path = "sqlite_db/model_hub.db"

# Create the database tables if they don't exist
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create users table if it doesn't exist
cursor.execute(
    """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    hashed_password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    is_superuser BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
)
"""
)
conn.commit()

# Initialize password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Check if admin exists
cursor.execute("SELECT id FROM users WHERE email = 'admin@example.com'")
admin = cursor.fetchone()

if admin:
    # Update admin
    hashed_password = pwd_context.hash("admin")
    cursor.execute(
        """
    UPDATE users 
    SET username = 'admin', hashed_password = ?, is_superuser = 1
    WHERE email = 'admin@example.com'
    """,
        (hashed_password,),
    )
    conn.commit()
    print("Admin user updated: admin@example.com / admin / admin")
else:
    # Create admin
    hashed_password = pwd_context.hash("admin")
    cursor.execute(
        """
    INSERT INTO users (email, username, full_name, hashed_password, is_superuser)
    VALUES (?, ?, ?, ?, ?)
    """,
        ("admin@example.com", "admin", "Admin User", hashed_password, 1),
    )
    conn.commit()
    print("Admin user created: admin@example.com / admin / admin")

# Close connection
conn.close()

print("\nDone! You should now be able to log in with:")
print("Email: admin@example.com")
print("Username: admin")
print("Password: admin")
