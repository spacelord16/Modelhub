from setuptools import setup, find_packages

setup(
    name="model-hub-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "sqlalchemy",
        "alembic",
        "python-multipart",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "pydantic",
        "pydantic-settings",
        "python-dotenv",
    ],
)
