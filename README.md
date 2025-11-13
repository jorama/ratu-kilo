# 🧠 Ratu Sovereign AI

**Multi-tenant SaaS platform powered by Kimi K2 for sovereign AI nodes**

Ratu Sovereign AI is a production-grade platform that provisions isolated AI nodes for organizations, ministries, universities, and enterprises. Each node has its own vector store, discovery agents, and knowledge base while sharing a single frozen Kimi K2 base model.

## 🎯 Core Concept

- **One Global Model**: Kimi K2 (MoE 1T → 32B active) powers all nodes
- **Model-Off Training**: Base model is NEVER retrained
- **Knowledge Growth**: Only through embeddings (RAG)
- **Sovereign Isolation**: Each organization gets its own private node
- **Zero Vendor Lock-in**: Deploy anywhere (cloud, on-prem, air-gapped)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RATU SOVEREIGN AI                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Ministry   │  │  University  │  │   Company    │      │
│  │   Node #1    │  │   Node #2    │  │   Node #3    │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ Vector Store │  │ Vector Store │  │ Vector Store │      │
│  │ Discovery    │  │ Discovery    │  │ Discovery    │      │
│  │ Chat + Voice │  │ Chat + Voice │  │ Chat + Voice │      │
│  │ Council      │  │ Council      │  │ Council      │      │
│  │ Analytics    │  │ Analytics    │  │ Analytics    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              SHARED KIMI K2 BASE MODEL (FROZEN)              │
│                    Never Retrained                           │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Monorepo Structure

```
ratu-sovereign-ai/
├── apps/
│   ├── api/              # REST/WebSocket API gateway
│   ├── worker/           # Background jobs (crawl, embed, audit)
│   ├── console/          # Super-admin dashboard (TeJoS)
│   ├── dashboard/        # Per-node admin UI
│   └── publicbot/        # Embeddable chat widget
├── packages/
│   ├── core/             # Shared types, DB schema, errors
│   ├── llm/              # Kimi K2 client + Council
│   ├── rag/              # Ingestion, chunking, embeddings, retrieval
│   ├── discovery/        # Crawlers, parsers, diff engine
│   ├── voice/            # STT/TTS adapters
│   ├── analytics/        # Metrics collection
│   ├── auth/             # RBAC, JWT, API keys
│   ├── audit/            # Immutable audit logs
│   └── ui/               # Shared React components
└── infra/
    ├── docker/           # Dockerfiles
    ├── k8s/              # Kubernetes manifests
    ├── terraform/        # Infrastructure as code
    └── seed/             # Demo data scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Qdrant (or Pinecone/Milvus)
- Kimi K2 API access

### Installation

#### Option 1: One-Command Launch (Recommended) 🚀

```bash
# Clone repository
git clone https://github.com/jorama/ratu-kilo.git
cd ratu-kilo

# Copy and edit environment file
cp .env.example .env
# Edit .env with your API keys (KIMI_K2_API_KEY, EMBEDDINGS_API_KEY, JWT_SECRET)

# Launch everything with ONE command!
# Linux/Mac:
./scripts/launch.sh

# Windows:
scripts\launch.bat

# Or using npm:
npm run launch
```

This single command will:
- ✅ Start Docker infrastructure (PostgreSQL, Redis, Qdrant, MinIO)
- ✅ Wait for services to be ready
- ✅ Run database migrations
- ✅ Seed demo data
- ✅ Start API Gateway (port 3001)
- ✅ Start Worker (background jobs)
- ✅ Start Marketing Website (port 3000)
- ✅ Start Dashboard (port 3003)
- ✅ Start Console (port 3002)

**All services running in one terminal with color-coded logs!**

#### Option 2: Manual Setup

```bash
# Clone repository
git clone https://github.com/jorama/ratu-kilo.git
cd ratu-kilo

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start infrastructure
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start all services
npm run start:all
```

#### Option 3: GitHub Codespaces (Zero Setup) ☁️

1. Go to https://github.com/jorama/ratu-kilo
2. Click **Code** → **Codespaces** → **Create codespace**
3. Wait 2-3 minutes for automatic setup
4. Run `./scripts/launch.sh`
5. All services auto-configured and running!

See [CODESPACES_GUIDE.md](CODESPACES_GUIDE.md) for details.

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Configuration

### Environment Variables

See [`.env.example`](.env.example) for all configuration options.

**Critical Settings:**

```env
# Kimi K2 Configuration
KIMI_K2_API_BASE=https://api.moonshot.cn/v1
KIMI_K2_API_KEY=your_kimi_k2_api_key
KIMI_K2_MODEL=moonshot-v1-128k

# Database
POSTGRES_URL=postgres://user:pass@localhost:5432/ratu

# Vector Database
VECTOR_DB_PROVIDER=qdrant
VECTOR_DB_URL=http://localhost:6333

# Embeddings
EMBEDDINGS_PROVIDER=openai
EMBEDDINGS_API_KEY=your_embeddings_key
```

## 📚 Core Packages

### @ratu/core

Shared types, database schema, and error handling.

```typescript
import { Organization, Node, ChatRequest } from '@ratu/core';
```

**Key Types:**
- `Organization` - Tenant organization
- `Node` - Sovereign AI node
- `User`, `ApiKey` - Authentication
- `Document`, `DocChunk`, `Embedding` - Knowledge base
- `ChatRequest`, `ChatResponse` - API contracts

### @ratu/llm

Kimi K2 client and Council multi-agent system.

```typescript
import { createKimiClient, createCouncil } from '@ratu/llm';

// Initialize client
const kimi = createKimiClient();

// Simple chat
const response = await kimi.complete('What is Ratu?');

// Chat with tools
const result = await kimi.chatWithTools(messages, tools);

// Multi-agent council
const council = createCouncil(kimi);
const analysis = await council.run(context, roles, { type: 'consensus' });
```

**Features:**
- ✅ Kimi K2 API wrapper with retry logic
- ✅ Tool calling support
- ✅ Citation parsing `[CIT:doc_id:chunk_ix]`
- ✅ Model integrity verification
- ✅ Multi-agent Council (deliberate, consensus, critic)
- ✅ Role-based prompts (researcher, analyst, editor, critic)

### @ratu/rag

RAG pipeline for ingestion, chunking, embedding, and retrieval.

```typescript
import { createRAGPipeline } from '@ratu/rag';

const rag = createRAGPipeline(orgId, vectorNamespace);

// Ingest document
await rag.ingest({
  uri: 'https://example.com/doc.pdf',
  title: 'Policy Document',
  content: '...',
});

// Retrieve relevant chunks
const results = await rag.retrieve('What is the policy?', { topK: 6 });

// Build context for LLM
const context = rag.buildContext(results);
```

### @ratu/discovery

Continuous discovery agents that crawl and update knowledge.

```typescript
import { createCrawler } from '@ratu/discovery';

const crawler = createCrawler({
  orgId,
  sourceId,
  type: 'website',
  url: 'https://ministry.gov.fj',
});

// Run full crawl
await crawler.crawl({ mode: 'full' });

// Run delta crawl (only changes)
await crawler.crawl({ mode: 'delta' });
```

### @ratu/voice

Speech-to-text and text-to-speech adapters.

```typescript
import { createVoiceService } from '@ratu/voice';

const voice = createVoiceService();

// Speech to text
const text = await voice.transcribe(audioBuffer);

// Text to speech
const audio = await voice.synthesize('Hello from Ratu');
```

## 🔌 API Endpoints

### Organization Management

```bash
# Create new organization
POST /v1/orgs
{
  "name": "Ministry of Health",
  "slug": "moh-fiji"
}

# Response
{
  "org_id": "uuid",
  "node_id": "uuid",
  "vector_namespace": "moh-fiji-uuid",
  "admin_invite_token": "token"
}
```

### Data Sources

```bash
# Add data source
POST /v1/orgs/:org_id/sources
{
  "type": "website",
  "url": "https://health.gov.fj",
  "crawl_rules": {
    "max_depth": 3,
    "allowed_domains": ["health.gov.fj"]
  }
}

# Trigger crawl
POST /v1/orgs/:org_id/sources/:source_id/crawl
{
  "mode": "delta"
}
```

### Chat

```bash
# Chat with citations
POST /v1/orgs/:org_id/chat
{
  "query": "What are the COVID-19 guidelines?",
  "top_k": 6,
  "citations": true
}

# Response
{
  "session_id": "uuid",
  "answer": "According to [CIT:doc1:0], the guidelines are...",
  "citations": [
    {
      "doc_id": "doc1",
      "chunk_ix": 0,
      "title": "COVID-19 Guidelines",
      "uri": "https://health.gov.fj/covid",
      "snippet": "..."
    }
  ],
  "usage": { "tokens_in": 150, "tokens_out": 200 },
  "latency_ms": 1250
}
```

### Council (Multi-Agent)

```bash
# Run council analysis
POST /v1/orgs/:org_id/council
{
  "query": "Analyze the budget allocation for 2024",
  "roles": ["researcher", "analyst", "editor"],
  "strategy": "consensus"
}

# Response
{
  "final": "Based on the analysis...",
  "panel": [
    {
      "role": "Researcher",
      "notes": "Key findings: [CIT:doc2:5]...",
      "citations": [...]
    },
    {
      "role": "Analyst",
      "notes": "Analysis shows [CIT:doc3:2]...",
      "citations": [...]
    }
  ],
  "citations": [...],
  "usage": { "tokens_in": 500, "tokens_out": 800 }
}
```

## 🎨 Dashboard Features

### Per-Node Admin Dashboard

Each organization gets a dedicated dashboard:

- **Overview**: Queries, latency, top intents, crawl status
- **Knowledge**: Manage sources, run crawls, view diffs
- **Chat Studio**: Test chat, toggle council/tools, see citations
- **Council**: Configure roles, run analysis, export reports
- **Voice**: Test STT/TTS, configure webhooks
- **Audit**: Timeline of all actions
- **Analytics**: Charts for queries, tokens, cost, accuracy
- **Settings**: API keys, users, permissions, embed code

### Super-Admin Console (TeJoS)

Global view across all tenants:

- **Tenants**: Health, usage, costs per organization
- **Alerts**: Failed crawls, high latency, errors
- **GPU Pool**: Resource allocation (if self-hosting)
- **Billing**: Plans, invoices, usage reports
- **Model Integrity**: Daily verification logs

## 🔐 Security & RBAC

### Roles

- **OWNER**: Full control, billing, delete org
- **ADMIN**: Manage sources, users, API keys
- **EDITOR**: Ingest data, run council, view analytics
- **VIEWER**: Chat only
- **BOT**: API/widget access

### API Authentication

```bash
# Using API key
curl -H "Authorization: Bearer ratu_key_xxx" \
  https://api.ratu.ai/v1/orgs/uuid/chat

# Using JWT
curl -H "Authorization: Bearer jwt_token" \
  https://api.ratu.ai/v1/orgs/uuid/chat
```

## 📊 Analytics & Audit

### Daily Metrics

Automatically collected per organization:

- Query count
- Token usage (in/out)
- Latency (p50, p95)
- Crawled documents
- Embeddings created
- Cost (USD)

### Audit Logs

Immutable log of all actions:

```typescript
{
  "actor_type": "user",
  "actor_id": "user_uuid",
  "action": "source.created",
  "target_type": "data_source",
  "target_id": "source_uuid",
  "payload": { "url": "..." },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Model Integrity Proofs

Daily verification that Kimi K2 base model is unchanged:

```typescript
{
  "org_id": "uuid",
  "model_name": "moonshot-v1-128k",
  "model_checksum": "sha256_hash",
  "verified_at": "2024-01-15T00:00:00Z",
  "proof": { /* cryptographic proof */ }
}
```

## 🚢 Deployment

### Cloud (SaaS)

```bash
# Deploy to Kubernetes
kubectl apply -f infra/k8s/

# Or use Terraform
cd infra/terraform
terraform init
terraform apply
```

### On-Premise

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or Kubernetes
kubectl apply -f infra/k8s/on-prem/
```

### Air-Gapped

1. Build all images offline
2. Transfer to secure network
3. Deploy with local registry
4. Configure without external API calls

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific package
npm test --workspace=@ratu/llm

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📖 API Documentation

Full API documentation available at:

- Development: http://localhost:3001/docs
- Production: https://api.ratu.ai/docs

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

Proprietary - © 2024 TeJoS / Ratu Sovereign AI

## 🆘 Support

- Email: support@ratu.ai
- Docs: https://docs.ratu.ai
- Discord: https://discord.gg/ratu

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core architecture
- ✅ Kimi K2 integration
- ✅ Multi-tenant isolation
- ✅ RAG pipeline
- ✅ Council multi-agent

### Phase 2 (Next)
- [ ] Voice agents
- [ ] Discovery automation
- [ ] Advanced analytics
- [ ] Mobile apps

### Phase 3 (Future)
- [ ] Agent marketplace
- [ ] Custom tools
- [ ] Multi-language support
- [ ] Enterprise SSO

## 💡 Use Cases

### Government Ministries
- Citizen service chatbots
- Policy analysis
- Document management
- Multi-language support

### Universities
- Research assistant
- Student support
- Course recommendations
- Academic paper analysis

### Enterprises
- Internal knowledge base
- Customer support
- Compliance monitoring
- Market analysis

### Healthcare
- Patient information
- Medical guidelines
- Appointment scheduling
- Health records search

## 🎯 Why Ratu?

1. **Sovereignty**: Full control over your AI and data
2. **Transparency**: Model never retrained, all changes audited
3. **Scalability**: One model serves unlimited organizations
4. **Cost-Effective**: No per-org model training costs
5. **Compliance**: On-prem and air-gapped options
6. **Extensibility**: Add custom tools and agents

---

**Built with ❤️ by TeJoS for sovereign AI everywhere**