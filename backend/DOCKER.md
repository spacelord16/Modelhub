# Docker Deployment Guide

This guide covers how to deploy the Model Hub backend using Docker.

## Prerequisites

- Docker installed and running
- Docker Compose installed
- Git repository cloned

## Quick Start

### Development Environment

1. **Start the development environment with PostgreSQL database:**

   ```bash
   ./docker-run.sh dev
   ```

   This will:

   - Build the backend Docker image
   - Start PostgreSQL database
   - Start the FastAPI application
   - Set up proper networking between services

2. **Access the application:**
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/v1/docs
   - Database: localhost:5432

### Production Environment

1. **Build and run production container:**
   ```bash
   ./docker-run.sh prod
   ```

## Available Commands

```bash
# Development environment
./docker-run.sh dev          # Start development with docker-compose
./docker-run.sh stop         # Stop all containers
./docker-run.sh logs         # View container logs
./docker-run.sh shell        # Open shell in running container

# Building and running
./docker-run.sh build        # Build development image
./docker-run.sh build prod   # Build production image
./docker-run.sh run          # Run standalone container
./docker-run.sh prod         # Build and run production

# Maintenance
./docker-run.sh clean        # Clean up images and containers
```

## Configuration

### Environment Variables

Copy `docker.env.example` to `docker.env` and configure:

```bash
# Database
POSTGRES_USER=modelhub
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=modelhub

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (update with your frontend URL)
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://your-frontend-domain.com"]
```

### Production Configuration

For production deployment, ensure you:

1. **Update environment variables:**

   - Change `SECRET_KEY` to a secure value
   - Update `POSTGRES_PASSWORD` to a strong password
   - Set `BACKEND_CORS_ORIGINS` to your frontend domain
   - Configure AWS credentials if using S3

2. **Use production Dockerfile:**
   ```bash
   docker build -f Dockerfile.prod -t modelhub-backend:prod .
   ```

## Docker Files Overview

### Dockerfile

- Development-focused build
- Single-stage build
- Includes development tools

### Dockerfile.prod

- Production-optimized build
- Multi-stage build for smaller image size
- Security hardened
- Multiple workers for better performance

### docker-compose.yml

- Complete development environment
- PostgreSQL database included
- Volume mounts for development
- Health checks and dependency management

## Deployment Options

### 1. Local Development

```bash
./docker-run.sh dev
```

### 2. Standalone Container

```bash
docker build -t modelhub-backend .
docker run -p 8000:8000 --env-file docker.env.example modelhub-backend
```

### 3. Production with External Database

```bash
docker build -f Dockerfile.prod -t modelhub-backend:prod .
docker run -d \
  --name modelhub-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e SECRET_KEY="your-secret-key" \
  modelhub-backend:prod
```

### 4. Cloud Deployment

#### AWS ECS/Fargate

1. Push image to ECR
2. Create ECS task definition
3. Configure RDS PostgreSQL
4. Deploy to ECS cluster

#### Google Cloud Run

1. Push image to GCR/Artifact Registry
2. Deploy to Cloud Run
3. Configure Cloud SQL PostgreSQL
4. Set environment variables

#### Railway/Render

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy automatically

## Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   ./docker-run.sh stop
   # Or change port in docker-compose.yml
   ```

2. **Database connection failed:**

   - Check if PostgreSQL container is running
   - Verify DATABASE_URL format
   - Check database credentials

3. **Permission denied:**

   ```bash
   chmod +x docker-run.sh
   ```

4. **Out of disk space:**
   ```bash
   ./docker-run.sh clean
   docker system prune -a
   ```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f db
```

### Debugging

```bash
# Open shell in running container
./docker-run.sh shell

# Or manually
docker exec -it modelhub-backend-container /bin/bash
```

## Performance Tuning

### Production Settings

1. **Worker Processes:**

   ```dockerfile
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
   ```

2. **Memory Limits:**

   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
       reservations:
         memory: 256M
   ```

3. **Database Connection Pool:**
   ```python
   # In your database configuration
   pool_size=10
   max_overflow=20
   pool_pre_ping=True
   ```

## Security Considerations

1. **Use non-root user in containers** ✅ (already implemented)
2. **Keep images updated** - Regularly rebuild with latest base images
3. **Scan for vulnerabilities** - Use `docker scan` or similar tools
4. **Limit container capabilities** - Use security profiles
5. **Use secrets management** - Don't embed secrets in images

## Monitoring

### Health Checks

The Docker images include health checks that verify:

- Application is responding on port 8000
- Database connectivity (in compose setup)

### Metrics

Consider adding monitoring with:

- Prometheus metrics endpoint
- Grafana dashboards
- Application performance monitoring (APM)

## Backup and Recovery

### Database Backups

```bash
# Backup
docker exec modelhub-db pg_dump -U modelhub modelhub > backup.sql

# Restore
docker exec -i modelhub-db psql -U modelhub modelhub < backup.sql
```

### Volume Backups

```bash
# Backup uploads
tar -czf uploads-backup.tar.gz backend/uploads/
```
