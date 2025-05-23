#!/bin/bash

# Docker deployment script for Model Hub Backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment with docker-compose"
    echo "  build       Build the Docker image"
    echo "  run         Run the container (requires built image)"
    echo "  prod        Build and run production container"
    echo "  stop        Stop and remove containers"
    echo "  logs        Show container logs"
    echo "  shell       Open shell in running container"
    echo "  clean       Clean up images and containers"
    echo ""
    echo "Options:"
    echo "  -h, --help  Show this help message"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to start development environment
start_dev() {
    print_status "Starting development environment..."
    check_docker
    
    # Copy environment file if it doesn't exist
    if [ ! -f docker.env ]; then
        print_warning "docker.env not found. Creating from example..."
        cp docker.env.example docker.env
        print_warning "Please edit docker.env with your configuration"
    fi
    
    docker-compose up --build -d
    print_status "Development environment started!"
    print_status "API will be available at: http://localhost:8000"
    print_status "API docs will be available at: http://localhost:8000/api/v1/docs"
    print_status "Database will be available at: localhost:5432"
}

# Function to build Docker image
build_image() {
    print_status "Building Docker image..."
    check_docker
    
    if [ "$1" = "prod" ]; then
        docker build -f Dockerfile.prod -t modelhub-backend:prod .
        print_status "Production image built: modelhub-backend:prod"
    else
        docker build -t modelhub-backend:latest .
        print_status "Development image built: modelhub-backend:latest"
    fi
}

# Function to run container
run_container() {
    print_status "Running container..."
    check_docker
    
    docker run -d \
        --name modelhub-backend \
        -p 8000:8000 \
        -v $(pwd)/uploads:/app/uploads \
        -v $(pwd)/sqlite_db:/app/sqlite_db \
        --env-file docker.env.example \
        modelhub-backend:latest
    
    print_status "Container started!"
    print_status "API available at: http://localhost:8000"
}

# Function to run production container
run_production() {
    print_status "Building and running production container..."
    build_image prod
    
    docker run -d \
        --name modelhub-backend-prod \
        -p 8000:8000 \
        -v $(pwd)/uploads:/app/uploads \
        --env-file docker.env.example \
        modelhub-backend:prod
    
    print_status "Production container started!"
    print_status "API available at: http://localhost:8000"
}

# Function to stop containers
stop_containers() {
    print_status "Stopping containers..."
    docker-compose down
    docker stop modelhub-backend 2>/dev/null || true
    docker stop modelhub-backend-prod 2>/dev/null || true
    docker rm modelhub-backend 2>/dev/null || true
    docker rm modelhub-backend-prod 2>/dev/null || true
    print_status "Containers stopped and removed"
}

# Function to show logs
show_logs() {
    if docker ps --format '{{.Names}}' | grep -q "modelhub.*backend"; then
        docker-compose logs -f backend
    else
        print_error "No running backend containers found"
    fi
}

# Function to open shell
open_shell() {
    if docker ps --format '{{.Names}}' | grep -q "modelhub.*backend"; then
        container_name=$(docker ps --format '{{.Names}}' | grep "modelhub.*backend" | head -1)
        docker exec -it $container_name /bin/bash
    else
        print_error "No running backend containers found"
    fi
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker images and containers..."
    docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
    docker rmi modelhub-backend:latest 2>/dev/null || true
    docker rmi modelhub-backend:prod 2>/dev/null || true
    docker system prune -f
    print_status "Cleanup completed"
}

# Main script logic
case "${1:-}" in
    dev)
        start_dev
        ;;
    build)
        build_image "${2:-}"
        ;;
    run)
        run_container
        ;;
    prod)
        run_production
        ;;
    stop)
        stop_containers
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    clean)
        cleanup
        ;;
    -h|--help|help)
        show_help
        ;;
    "")
        print_error "No command specified"
        show_help
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 