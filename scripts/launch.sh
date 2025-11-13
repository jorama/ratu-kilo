#!/bin/bash

# Ratu Sovereign AI - One-Command Launch Script
# This script starts all services with a single command

set -e

echo "=================================="
echo "🚀 Ratu Sovereign AI Launcher"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}❌ Docker not found. Please install Docker${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your API keys before continuing${NC}"
    echo -e "${YELLOW}   Required: KIMI_K2_API_KEY, EMBEDDINGS_API_KEY, JWT_SECRET${NC}"
    read -p "Press Enter when ready to continue..."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Start Docker infrastructure
echo "🐳 Starting Docker infrastructure..."
docker-compose up -d

echo "⏳ Waiting for services to be ready (15 seconds)..."
sleep 15

# Check if services are healthy
echo "🔍 Checking service health..."

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services running${NC}"
else
    echo -e "${RED}❌ Docker services failed to start${NC}"
    docker-compose logs
    exit 1
fi

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd packages/db && npm run migrate
cd ../..
echo -e "${GREEN}✅ Migrations complete${NC}"

# Seed data
echo ""
echo "🌱 Seeding database..."
cd infra/seed && npm run seed
cd ../..
echo -e "${GREEN}✅ Seed data loaded${NC}"

# Start all applications
echo ""
echo "🚀 Starting all applications..."
echo ""
echo -e "${BLUE}Services will be available at:${NC}"
echo -e "  ${GREEN}Marketing Website:${NC} http://localhost:3000"
echo -e "  ${GREEN}API Gateway:${NC}      http://localhost:3001"
echo -e "  ${GREEN}Console:${NC}          http://localhost:3002"
echo -e "  ${GREEN}Dashboard:${NC}        http://localhost:3003"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Use concurrently to run all services
npx concurrently \
  --names "API,WORKER,WEBSITE,DASHBOARD,CONSOLE" \
  --prefix-colors "blue,green,magenta,cyan,yellow" \
  "cd apps/api && npm run dev" \
  "cd apps/worker && npm run dev" \
  "cd apps/website && npm run dev" \
  "cd apps/dashboard && npm run dev" \
  "cd apps/console && npm run dev"