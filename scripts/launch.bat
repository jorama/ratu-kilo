@echo off
REM Ratu Sovereign AI - One-Command Launch Script for Windows
REM This script starts all services with a single command

echo ==================================
echo 🚀 Ratu Sovereign AI Launcher
echo ==================================
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  No .env file found. Copying from .env.example...
    copy .env.example .env
    echo ⚠️  Please edit .env with your API keys before continuing
    echo    Required: KIMI_K2_API_KEY, EMBEDDINGS_API_KEY, JWT_SECRET
    pause
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo ✅ Dependencies installed
    echo.
)

REM Start Docker infrastructure
echo 🐳 Starting Docker infrastructure...
docker-compose up -d

echo ⏳ Waiting for services to be ready (15 seconds)...
timeout /t 15 /nobreak >nul

REM Run migrations
echo.
echo 🗄️  Running database migrations...
cd packages\db
call npm run migrate
cd ..\..
echo ✅ Migrations complete

REM Seed data
echo.
echo 🌱 Seeding database...
cd infra\seed
call npm run seed
cd ..\..
echo ✅ Seed data loaded

REM Start all applications
echo.
echo 🚀 Starting all applications...
echo.
echo Services will be available at:
echo   Marketing Website: http://localhost:3000
echo   API Gateway:      http://localhost:3001
echo   Console:          http://localhost:3002
echo   Dashboard:        http://localhost:3003
echo.
echo Press Ctrl+C to stop all services
echo.

REM Use concurrently to run all services
npx concurrently ^
  --names "API,WORKER,WEBSITE,DASHBOARD,CONSOLE" ^
  --prefix-colors "blue,green,magenta,cyan,yellow" ^
  "cd apps/api && npm run dev" ^
  "cd apps/worker && npm run dev" ^
  "cd apps/website && npm run dev" ^
  "cd apps/dashboard && npm run dev" ^
  "cd apps/console && npm run dev"