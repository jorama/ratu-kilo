# ⚡ Ratu Sovereign AI - Quick Start Guide

Get Ratu running in 5 minutes!

## 🎯 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Kimi K2 API Key** ([Get one](https://platform.moonshot.cn/))

## 🚀 Installation

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/tejos/ratu-sovereign-ai.git
cd ratu-sovereign-ai

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

**Minimum required settings:**

```env
# Kimi K2 (REQUIRED)
KIMI_K2_API_KEY=your_kimi_k2_api_key_here

# Database (auto-configured for Docker)
POSTGRES_URL=postgres://ratu:ratu_dev_password@localhost:5432/ratu
REDIS_URL=redis://localhost:6379
VECTOR_DB_URL=http://localhost:6333

# Embeddings (use OpenAI or compatible)
EMBEDDINGS_API_KEY=your_embeddings_key_here

# Security
JWT_SECRET=change_this_to_random_32_char_string
```

### Step 3: Start Infrastructure

```bash
# Start PostgreSQL, Redis, Qdrant, MinIO
docker-compose up -d

# Wait for services to be healthy (30 seconds)
docker-compose ps
```

### Step 4: Initialize Database

```bash
# Run migrations
npm run db:migrate

# (Optional) Load demo data
npm run db:seed
```

### Step 5: Start Development

```bash
# Start all services in development mode
npm run dev
```

This starts:
- **API Gateway** → http://localhost:3001
- **Dashboard** → http://localhost:3003
- **Console** → http://localhost:3002
- **Worker** → Background jobs

## ✅ Verify Installation

### Test API Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "vector_db": "healthy"
  }
}
```

### Create Your First Organization

```bash
curl -X POST http://localhost:3001/v1/orgs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Organization",
    "slug": "demo",
    "admin_email": "admin@demo.com"
  }'
```

Save the response - you'll need the `org_id` and `admin_invite_token`.

### Add a Data Source

```bash
# Replace ORG_ID with your org_id from above
curl -X POST http://localhost:3001/v1/orgs/ORG_ID/sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "type": "website",
    "url": "https://example.com"
  }'
```

### Run Your First Crawl

```bash
# Replace ORG_ID and SOURCE_ID
curl -X POST http://localhost:3001/v1/orgs/ORG_ID/sources/SOURCE_ID/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"mode": "full"}'
```

### Chat with Your AI

```bash
curl -X POST http://localhost:3001/v1/orgs/ORG_ID/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "What information do you have?",
    "citations": true
  }'
```

## 🎨 Access Dashboards

### Organization Dashboard
```
http://localhost:3003
```
Login with the admin invite token from Step 5.

### Super Admin Console
```
http://localhost:3002
```
Login with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

## 🧪 Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Specific package
npm test --workspace=@ratu/llm
```

## 📊 Monitor Services

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f qdrant
```

### Check Service Status

```bash
docker-compose ps
```

### Access Service UIs

- **Qdrant Dashboard**: http://localhost:6333/dashboard
- **MinIO Console**: http://localhost:9001 (user: `ratu`, pass: `ratu_dev_password`)
- **Redis**: Use `redis-cli` or Redis Desktop Manager

## 🔧 Common Issues

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3001  # or :5432, :6379, etc.

# Change ports in docker-compose.yml or .env
```

### Database Connection Failed

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Kimi K2 API Errors

```bash
# Verify your API key
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.moonshot.cn/v1/models
```

### Vector DB Not Responding

```bash
# Restart Qdrant
docker-compose restart qdrant

# Check health
curl http://localhost:6333/health
```

## 🛑 Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

## 📚 Next Steps

1. **Read the [README](README.md)** for architecture overview
2. **Check [IMPLEMENTATION_GUIDE](IMPLEMENTATION_GUIDE.md)** to build remaining features
3. **Review [API_EXAMPLES](API_EXAMPLES.md)** for all endpoints
4. **Join our Discord** for support

## 🆘 Getting Help

- **Documentation**: https://docs.ratu.ai
- **GitHub Issues**: https://github.com/tejos/ratu-sovereign-ai/issues
- **Discord**: https://discord.gg/ratu
- **Email**: support@ratu.ai

## 🎯 What's Working Now

✅ Core monorepo structure
✅ Database schema
✅ Kimi K2 client
✅ Council multi-agent system
✅ Docker infrastructure
✅ Environment configuration

## 🚧 What Needs Implementation

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for:
- RAG pipeline
- Discovery agents
- API gateway
- Dashboards
- Voice layer
- And more...

---

**Ready to build the future of sovereign AI? Let's go! 🚀**