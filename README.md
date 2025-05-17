# Deep Learning Model Hub

A platform for sharing, discovering, and deploying deep learning models.

## Project Structure

- `backend/`: FastAPI backend service
- `frontend/`: Next.js frontend application
- `docs/`: Documentation
- `infrastructure/`: Deployment configurations

## Quick Start

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run setup script (creates SQLite DB, default admin, etc.)
chmod +x setup.sh
./setup.sh

# Start backend server
python -m uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000 with API docs at http://localhost:8000/api/v1/docs.

Default admin credentials: `admin@example.com` / `admin`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at http://localhost:3001

## Features

- User authentication and authorization
- Model uploading and downloading
- Model discovery and filtering
- Performance metrics tracking
- Dark mode support

## Technology Stack

### Backend

- FastAPI
- SQLAlchemy (PostgreSQL or SQLite)
- JWT Authentication
- Pydantic

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Axios

## License

MIT
