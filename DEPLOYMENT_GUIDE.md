# 🚀 Ratu Sovereign AI - Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2025-01-13
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running Services](#running-services)
6. [API Usage](#api-usage)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### Required API Keys
- **Kimi K2 API Key** ([Get one](https://platform.moonshot.cn/))
- **OpenAI API Key** (for embeddings) ([Get one](https://platform.openai.com/))

### Optional API Keys
- **Deepgram** (for advanced STT)
- **ElevenLabs** (for advanced TTS)

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/jorama/ratu-kilo.git
cd ratu-kilo
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Minimum required settings:**

```env
# Kimi K2 (REQUIRED)
KIMI_K2_API_KEY=your_kimi_k2_api_key_here

# Embeddings (REQUIRED)
EMBEDDINGS_API_KEY=your_openai_api_key_here

# Security (REQUIRED)
JWT_SECRET=your_random_32_character_secret_here

# Database (auto-configured for Docker)
POSTGRES_URL=postgres://ratu:ratu_dev_password@localhost:5432/ratu
REDIS_URL=redis://localhost:6379
VECTOR_DB_URL=http://localhost:6333
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL, Redis, Qdrant, MinIO
docker-compose up -d

# Wait for services (30 seconds)
docker-compose ps
```

### 4. Initialize Database

```bash
# Run migrations
npm run db:migrate

# (Optional) Load demo data
npm run db:seed
```

### 5. Build Packages

```bash
# Build all packages
npm run build
```

### 6. Start Services

```bash
# Terminal 1: API Gateway
cd apps/api
npm run dev

# Terminal 2: Worker
cd apps/worker
npm run dev
```

---

## 🔧 Environment Configuration

### Complete .env Template

```env
# =========================
# KIMI K2 CONFIGURATION
# =========================
KIMI_K2_API_BASE=https://api.moonshot.cn/v1
KIMI_K2_API_KEY=your_kimi_k2_api_key
KIMI_K2_MODEL=moonshot-v1-128k
KIMI_K2_MAX_RETRIES=3
KIMI_K2_TIMEOUT=60000

# =========================
# DATABASE
# =========================
POSTGRES_URL=postgres://ratu:ratu_dev_password@localhost:5432/ratu
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ratu
POSTGRES_USER=ratu
POSTGRES_PASSWORD=ratu_dev_password

# =========================
# REDIS
# =========================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# =========================
# VECTOR DATABASE
# =========================
VECTOR_DB_PROVIDER=qdrant
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_COLLECTION_PREFIX=ratu_

# =========================
# EMBEDDINGS
# =========================
EMBEDDINGS_PROVIDER=openai
EMBEDDINGS_API_BASE=https://api.openai.com/v1
EMBEDDINGS_API_KEY=your_openai_api_key
EMBEDDINGS_MODEL=text-embedding-3-large
EMBEDDINGS_DIMENSIONS=1536

# =========================
# OBJECT STORAGE
# =========================
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=ratu
S3_SECRET_KEY=ratu_dev_password
S3_BUCKET=ratu-documents
S3_REGION=us-east-1

# =========================
# SECURITY
# =========================
JWT_SECRET=change_this_to_random_32_char_string
JWT_EXPIRES_IN=7d
API_KEY_SALT_ROUNDS=10

# =========================
# API SERVER
# =========================
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*

# =========================
# VOICE (OPTIONAL)
# =========================
STT_PROVIDER=whisper
TTS_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key

# Deepgram (optional)
DEEPGRAM_API_KEY=your_deepgram_key

# ElevenLabs (optional)
ELEVENLABS_API_KEY=your_elevenlabs_key
```

---

## 💾 Database Setup

### Run Migrations

```bash
# Using psql
psql $POSTGRES_URL < packages/core/src/db/schema.sql

# Or using npm script (to be created)
npm run db:migrate
```

### Verify Tables

```bash
psql $POSTGRES_URL -c "\dt"
```

Expected tables:
- organizations
- nodes
- users
- api_keys
- data_sources
- documents
- doc_chunks
- embeddings
- crawl_jobs
- crawl_events
- chat_sessions
- messages
- audit_logs
- metrics_daily
- model_integrity

---

## 🏃 Running Services

### Development Mode

```bash
# Start all services
npm run dev

# Or individually:
cd apps/api && npm run dev      # API on :3001
cd apps/worker && npm run dev   # Worker
```

### Production Mode

```bash
# Build all packages
npm run build

# Start services
cd apps/api && npm start
cd apps/worker && npm start
```

### Using Docker

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f worker
```

---

## 🔌 API Usage

### Health Check

```bash
curl http://localhost:3001/health
```

### Create Organization

```bash
curl -X POST http://localhost:3001/api/v1/orgs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Organization",
    "slug": "demo",
    "admin_email": "admin@demo.com"
  }'
```

### Add Data Source

```bash
curl -X POST http://localhost:3001/api/v1/orgs/ORG_ID/sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "type": "website",
    "url": "https://example.com"
  }'
```

### Trigger Crawl

```bash
curl -X POST http://localhost:3001/api/v1/orgs/ORG_ID/sources/SOURCE_ID/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"mode": "full"}'
```

### Chat with AI

```bash
curl -X POST http://localhost:3001/api/v1/orgs/ORG_ID/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "What information do you have?",
    "citations": true,
    "top_k": 6
  }'
```

### Run Council Analysis

```bash
curl -X POST http://localhost:3001/api/v1/orgs/ORG_ID/council \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "Analyze the budget allocation",
    "roles": ["researcher", "analyst", "editor"],
    "strategy": "consensus"
  }'
```

### Get Analytics

```bash
curl http://localhost:3001/api/v1/orgs/ORG_ID/analytics/daily?days=30 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 📊 Monitoring

### Service Health

```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose logs -f postgres
docker-compose logs -f qdrant
docker-compose logs -f api
docker-compose logs -f worker
```

### Access Service UIs

- **Qdrant Dashboard**: http://localhost:6333/dashboard
- **MinIO Console**: http://localhost:9001 (user: `ratu`, pass: `ratu_dev_password`)
- **API Health**: http://localhost:3001/health

### Queue Monitoring

```bash
# Connect to Redis
redis-cli

# Check queue lengths
LLEN bull:crawl:wait
LLEN bull:embed:wait
LLEN bull:metrics:wait
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001  # or :5432, :6379, etc.

# Kill process
kill -9 PID

# Or change port in .env
PORT=3002
```

### Database Connection Failed

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify connection
psql $POSTGRES_URL -c "SELECT 1"
```

### Kimi K2 API Errors

```bash
# Test API key
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.moonshot.cn/v1/models

# Check rate limits
# Verify API base URL
```

### Vector DB Not Responding

```bash
# Restart Qdrant
docker-compose restart qdrant

# Check health
curl http://localhost:6333/health

# View collections
curl http://localhost:6333/collections
```

### Worker Not Processing Jobs

```bash
# Check Redis connection
redis-cli ping

# Check queue status
redis-cli LLEN bull:crawl:wait

# Restart worker
docker-compose restart worker
```

---

## 🔒 Security Checklist

### Before Production

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Configure CORS properly
- [ ] Enable HTTPS/TLS
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Review API key scopes

### Environment Variables

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate API key salt
openssl rand -hex 16
```

---

## 📈 Performance Tuning

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_documents_org_id ON documents(org_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_audit_logs_org_timestamp ON audit_logs(org_id, timestamp DESC);
```

### Redis

```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Qdrant

```yaml
# In docker-compose.yml, increase resources
qdrant:
  deploy:
    resources:
      limits:
        memory: 4G
```

---

## 🔄 Backup & Recovery

### Database Backup

```bash
# Backup
pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $POSTGRES_URL < backup_20250113.sql
```

### Vector Store Backup

```bash
# Qdrant snapshots
curl -X POST http://localhost:6333/collections/ratu_demo/snapshots

# Download snapshot
curl http://localhost:6333/collections/ratu_demo/snapshots/snapshot_name \
  -o snapshot.tar
```

---

## 🌐 Production Deployment

### Using Docker Compose

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Using Kubernetes

```bash
# Apply manifests
kubectl apply -f infra/k8s/

# Check status
kubectl get pods -n ratu

# View logs
kubectl logs -f deployment/ratu-api -n ratu
```

### Using Terraform

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

---

## 📊 Monitoring & Alerts

### Metrics to Monitor

- API response time (p50, p95, p99)
- Error rate
- Queue length
- Database connections
- Memory usage
- CPU usage
- Disk space

### Recommended Tools

- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Sentry** - Error tracking
- **Datadog** - APM
- **PagerDuty** - Alerting

---

## 🎯 Next Steps

1. **Test the API** - Use the examples above
2. **Monitor logs** - Watch for errors
3. **Load test** - Use tools like k6 or Artillery
4. **Security audit** - Review access controls
5. **Deploy to staging** - Test in production-like environment
6. **Go live!** - Deploy to production

---

## 📞 Support

- **Documentation**: https://docs.ratu.ai
- **GitHub Issues**: https://github.com/jorama/ratu-kilo/issues
- **Email**: support@ratu.ai

---

**The platform is ready. Time to deploy!** 🚀