#!/bin/bash

# luckygo Docker Management Script
# Usage: ./docker-scripts.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Development environment
dev_up() {
    log_info "Starting development environment..."
    cp .env.example .env 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml up -d
    log_success "Development environment started!"
    log_info "Application: http://localhost:3000"
    log_info "Redis Commander: http://localhost:8081"
}

dev_down() {
    log_info "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    log_success "Development environment stopped!"
}

dev_logs() {
    docker-compose -f docker-compose.dev.yml logs -f
}

# Production environment
prod_up() {
    log_info "Starting production environment..."
    if [ ! -f .env ]; then
        log_warning "No .env file found. Copying from .env.docker"
        cp .env.docker .env
    fi
    docker-compose up -d
    log_success "Production environment started!"
    log_info "Application: http://localhost:3000"
}

prod_up_nginx() {
    log_info "Starting production environment with Nginx..."
    if [ ! -f .env ]; then
        log_warning "No .env file found. Copying from .env.docker"
        cp .env.docker .env
    fi
    docker-compose --profile production up -d
    log_success "Production environment with Nginx started!"
    log_info "Application: http://localhost:80"
}

prod_down() {
    log_info "Stopping production environment..."
    docker-compose down
    log_success "Production environment stopped!"
}

prod_logs() {
    docker-compose logs -f
}

# Utility functions
build() {
    log_info "Building Docker images..."
    docker-compose build
    log_success "Images built successfully!"
}

clean() {
    log_warning "This will remove all containers, networks, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Cleaning up Docker resources..."
        docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans 2>/dev/null || true
        docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
        docker system prune -f
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

status() {
    log_info "Checking service status..."
    echo "=== Development Services ==="
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "Development environment not running"
    echo ""
    echo "=== Production Services ==="
    docker-compose ps 2>/dev/null || echo "Production environment not running"
}

backup_redis() {
    log_info "Creating Redis backup..."
    docker-compose exec -T redis redis-cli BGSAVE
    docker-compose exec -T redis sh -c 'while [ $(redis-cli LASTSAVE) -eq $(redis-cli LASTSAVE) ]; do sleep 1; done'
    docker cp $(docker-compose ps -q redis):/data/dump.rdb ./redis-backup-$(date +%Y%m%d-%H%M%S).rdb
    log_success "Redis backup created!"
}

show_help() {
    echo "luckygo Docker Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Development Commands:"
    echo "  dev:up       Start development environment"
    echo "  dev:down     Stop development environment"
    echo "  dev:logs     View development logs"
    echo ""
    echo "Production Commands:"
    echo "  prod:up      Start production environment"
    echo "  prod:nginx   Start production with Nginx"
    echo "  prod:down    Stop production environment"
    echo "  prod:logs    View production logs"
    echo ""
    echo "Utility Commands:"
    echo "  build        Build Docker images"
    echo "  status       Show service status"
    echo "  clean        Clean up all Docker resources"
    echo "  backup       Backup Redis data"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev:up              # Start development environment"
    echo "  $0 prod:nginx          # Start production with Nginx"
    echo "  $0 backup              # Backup Redis data"
}

# Main script
main() {
    check_dependencies

    case "${1:-help}" in
        "dev:up"|"dev-up")
            dev_up
            ;;
        "dev:down"|"dev-down")
            dev_down
            ;;
        "dev:logs"|"dev-logs")
            dev_logs
            ;;
        "prod:up"|"prod-up")
            prod_up
            ;;
        "prod:nginx"|"prod-nginx")
            prod_up_nginx
            ;;
        "prod:down"|"prod-down")
            prod_down
            ;;
        "prod:logs"|"prod-logs")
            prod_logs
            ;;
        "build")
            build
            ;;
        "status")
            status
            ;;
        "clean")
            clean
            ;;
        "backup")
            backup_redis
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
