#!/bin/bash

# Docker run helper script for Folder Configuration Tool

echo "🐳 Folder Configuration Tool - Docker Runner"
echo "=============================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "Choose your deployment option:"
echo ""
echo "1) Development (with PostgreSQL)"
echo "2) Production (external database)"
echo "3) Custom configuration"
echo "4) Show current status"
echo "5) Stop all services"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Starting development environment..."
        echo "   - Includes PostgreSQL database"
        echo "   - Includes pgAdmin (optional)"
        echo "   - Uses local environment variables"
        echo ""
        docker-compose up -d
        echo ""
        echo "✅ Development environment started!"
        echo "   Web App: http://localhost:3001"
        echo "   Database: localhost:5432"
        echo "   pgAdmin: http://localhost:8080"
        ;;
    2)
        echo "🚀 Starting production environment..."
        echo "   - Uses external database"
        echo "   - Production mode enabled"
        echo "   - No pgAdmin included"
        echo ""
        echo "⚠️  Make sure you have DATABASE_URL set in your environment"
        echo ""
        DATABASE_URL="${DATABASE_URL}" \
        NODE_ENV=production \
        docker-compose up -d
        echo ""
        echo "✅ Production environment started!"
        echo "   Web App: http://localhost:3001"
        ;;
    3)
        echo "🔧 Custom configuration..."
        echo ""
        read -p "Enter DATABASE_URL: " db_url
        read -p "Enter NODE_ENV (development/production): " node_env
        read -p "Skip GitHub import? (true/false): " skip_github
        read -p "Port (default 3001): " port
        port=${port:-3001}
        
        echo ""
        echo "🚀 Starting with custom configuration..."
        DATABASE_URL="${db_url}" \
        NODE_ENV="${node_env}" \
        SKIP_GITHUB_IMPORT="${skip_github}" \
        PORT="${port}" \
        docker-compose up -d
        ;;
    4)
        echo "📊 Current Docker status:"
        echo ""
        docker-compose ps
        echo ""
        echo "📊 Container logs (last 10 lines):"
        docker-compose logs --tail=10
        ;;
    5)
        echo "🛑 Stopping all services..."
        docker-compose down
        echo "✅ All services stopped"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📚 For more options, see DOCKER.md"
echo "🐳 Happy containerizing!"
