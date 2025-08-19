# Docker Deployment Guide

This guide explains how to deploy the Folder Configuration Tool using Docker.

## 🐳 Quick Start

### Prerequisites
- Docker installed on your system
- Docker Compose installed
- GitHub Personal Access Token (optional, for auto-import)

### 1. Build and Run with Docker Compose

```bash
# Clone the repository
git clone <your-repo-url>
cd folder-config-tool

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Build and start services
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Access the Application
- **Web App**: http://localhost:3001
- **Database**: localhost:5432
- **pgAdmin** (optional): http://localhost:8080

## 🚀 Production Deployment

### Using Docker Compose

```bash
# Development mode (includes PostgreSQL)
docker-compose up -d

# Production mode (use external database)
DATABASE_URL="postgresql://user:pass@host:port/db" \
NODE_ENV=production \
docker-compose up -d
```

### Using Docker Run

```bash
# Build image
docker build -t folder-config-tool:latest .

# Run with environment variables
docker run -d \
  --name folder-config-app \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:port/db" \
  -e GITHUB_TOKEN="ghp_your_token" \
  -e GITHUB_ORG="your_org" \
  -e NODE_ENV=production \
  folder-config-tool:latest
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

**Note**: The `SKIP_GITHUB_IMPORT` option allows you to skip GitHub user import for faster startup. Set to `true` when you don't need fresh user data.

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres_password@postgres:5432/folder_config

# GitHub Integration (Optional)
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_ORG=your_org_name

# Skip GitHub Import (Optional - for faster startup)
SKIP_GITHUB_IMPORT=false

# Server Configuration
PORT=3001
NODE_ENV=production
```

### Database Configuration

The Docker Compose setup includes:
- **PostgreSQL 15** with Alpine Linux
- **Persistent volume** for data storage
- **Health checks** for reliability
- **Network isolation** for security

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser  │    │  Folder Config  │    │   PostgreSQL    │
│                 │◄──►│      App        │◄──►│    Database     │
│  Port 3001     │    │  Port 3001      │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   GitHub API    │
                       │  (Auto-import)  │
                       └─────────────────┘
```

## 🛠️ Docker Commands

### Development

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build
```

### Production

```bash
# Build production image
docker build -f Dockerfile.prod -t folder-config-tool:latest .

# Run production container
docker run -d \
  --name folder-config-app \
  --restart unless-stopped \
  -p 3001:3001 \
  -e DATABASE_URL="your_db_url" \
  folder-config-tool:latest

# View logs
docker logs -f folder-config-app

# Stop container
docker stop folder-config-app
```

## 🔍 Monitoring and Debugging

### Health Checks

The application includes health checks:
- **App health**: Checks if web server responds
- **Database health**: Checks PostgreSQL connectivity
- **Auto-restart**: Container restarts on failure

### Logs

```bash
# View application logs
docker-compose logs app

# View database logs
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f app
```

### Database Access

```bash
# Connect to database from host
psql "postgresql://postgres:postgres_password@localhost:5432/folder_config"

# Access from container
docker exec -it folder_config_db psql -U postgres -d folder_config

# Use pgAdmin (if enabled)
# Open http://localhost:8080
# Login: admin@example.com / admin_password
```

## 🔒 Security Features

### Security Measures
- **Non-root user**: Application runs as `nodejs` user
- **Network isolation**: Services communicate via internal network
- **Minimal base image**: Alpine Linux for smaller attack surface
- **No sensitive data**: Environment variables for configuration

### Network Security
```bash
# View network configuration
docker network ls
docker network inspect folder_config_folder_config_network

# Isolate services
docker-compose up --network-alias app
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale application instances
docker-compose up --scale app=3

# Load balancer configuration (example with nginx)
# Add to docker-compose.yml:
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on:
    - app
```

### Database Scaling

```bash
# Use external database
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:pass@your-db-host:5432/db

# Or use managed database service
# - AWS RDS
# - Google Cloud SQL
# - Azure Database for PostgreSQL
```

## 🚨 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env

# Verify database connection
docker-compose exec app psql "$DATABASE_URL" -c "SELECT 1;"
```

**Permission denied errors:**
```bash
# Fix script permissions
docker-compose exec app chmod +x *.sh

# Check file ownership
docker-compose exec app ls -la
```

**Database connection issues:**
```bash
# Check database status
docker-compose ps postgres

# Test database connectivity
docker-compose exec app psql "$DATABASE_URL" -c "SELECT version();"
```

**GitHub import not working:**
```bash
# Check environment variables
docker-compose exec app env | grep GITHUB

# Test GitHub API access
docker-compose exec app curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/orgs/$GITHUB_ORG"
```

### Performance Tuning

```bash
# Increase memory limits
docker-compose up -d --scale app=2

# Monitor resource usage
docker stats

# Optimize database
docker-compose exec postgres psql -U postgres -d folder_config -c "
  ALTER SYSTEM SET shared_buffers = '256MB';
  ALTER SYSTEM SET effective_cache_size = '1GB';
"
```

## 🌐 Deployment Examples

### Local Development
```bash
# Normal startup (with GitHub import)
docker-compose up

# Fast startup (skip GitHub import)
SKIP_GITHUB_IMPORT=true docker-compose up
```

### Staging Environment
```bash
# Use production Dockerfile
docker build -f Dockerfile.prod -t folder-config-tool:staging .

# Run with staging config
docker run -d \
  --name folder-config-staging \
  -p 3002:3001 \
  -e NODE_ENV=staging \
  -e DATABASE_URL="staging_db_url" \
  folder-config-tool:staging
```

### Production Deployment
```bash
# Build and push to registry
docker build -f Dockerfile.prod -t your-registry/folder-config-tool:latest .
docker push your-registry/folder-config-tool:latest

# Deploy to production
docker run -d \
  --name folder-config-prod \
  --restart unless-stopped \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="production_db_url" \
  your-registry/folder-config-tool:latest
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Image](https://hub.docker.com/_/node)

---

**Happy Containerizing! 🐳**
