#!/usr/bin/env python3
"""
Generate a secure secret key for JWT authentication in production.
Run this script and use the output as your SECRET_KEY environment variable.
"""

import secrets
import string


def generate_secret_key(length=64):
    """Generate a cryptographically secure random string."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


if __name__ == "__main__":
    secret_key = generate_secret_key()
    print("🔐 Generated secure secret key for production:")
    print(f"SECRET_KEY={secret_key}")
    print("\n💡 Copy this value to your deployment platform's environment variables!")
    print("⚠️  Keep this secret and never commit it to version control!")
