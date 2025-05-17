# Deep Learning Model Hub - Backend

This is the backend service for the Deep Learning Model Hub, built with FastAPI.

## Features

- User authentication with JWT
- Model management (upload, download, search)
- Performance metrics tracking
- API documentation with OpenAPI

## Quick Start

For quick local development, you can use the provided setup script:

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup script
./setup.sh
```

This will:

1. Create necessary directories
2. Install required dependencies
3. Create a default `.env` file with SQLite configuration
4. Set up database tables
5. Create a default admin user (admin@example.com / admin)

Then start the server:

```bash
python -m uvicorn app.main:app --reload
```

## Installation (Manual)

### Prerequisites

- Python 3.8 or higher
- PostgreSQL database (optional - can use SQLite for development)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create environment variables file (`.env`):

```bash
SECRET_KEY=your-secret-key
# Database options
# Set USE_SQLITE=true to use SQLite instead of PostgreSQL
USE_SQLITE=true  # Set to false to use PostgreSQL
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=modelhub
# File storage
UPLOAD_DIR=uploads
```

4. If using PostgreSQL, run database migrations (using alembic):

```bash
alembic upgrade head
```

5. Start the development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## API Documentation

- Interactive API docs: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Model Management Endpoints

- `GET /api/v1/models`: List all models
- `POST /api/v1/models`: Upload a new model
- `GET /api/v1/models/{model_id}`: Get a specific model
- `PUT /api/v1/models/{model_id}`: Update a model
- `DELETE /api/v1/models/{model_id}`: Delete a model
- `POST /api/v1/models/{model_id}/download`: Download a model
- `POST /api/v1/models/{model_id}/metrics`: Update model metrics
- `GET /api/v1/models/user/{user_id}`: Get models by a specific user

## Environment Variables

| Variable          | Description                        | Default              |
| ----------------- | ---------------------------------- | -------------------- |
| SECRET_KEY        | Secret key for JWT                 | your-secret-key-here |
| USE_SQLITE        | Use SQLite instead of PostgreSQL   | false                |
| POSTGRES_SERVER   | PostgreSQL server host             | localhost            |
| POSTGRES_USER     | PostgreSQL username                | postgres             |
| POSTGRES_PASSWORD | PostgreSQL password                | postgres             |
| POSTGRES_DB       | PostgreSQL database name           | modelhub             |
| UPLOAD_DIR        | Directory to store uploaded models | uploads              |

## Testing

Run tests with pytest:

```bash
pytest
```
