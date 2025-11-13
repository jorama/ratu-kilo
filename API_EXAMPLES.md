# 🔌 Ratu Sovereign AI - API Examples

Complete API reference with curl examples for all endpoints.

## 🔐 Authentication

All API requests require authentication via API key or JWT token.

```bash
# Using API Key
curl -H "Authorization: Bearer ratu_key_xxxxx" \
  https://api.ratu.ai/v1/endpoint

# Using JWT Token
curl -H "Authorization: Bearer eyJhbGc..." \
  https://api.ratu.ai/v1/endpoint
```

---

## 🏢 Organization Management

### Create Organization

```bash
curl -X POST https://api.ratu.ai/v1/orgs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_token" \
  -d '{
    "name": "Ministry of Health Fiji",
    "slug": "moh-fiji",
    "admin_email": "admin@health.gov.fj"
  }'
```

**Response:**
```json
{
  "org_id": "550e8400-e29b-41d4-a716-446655440000",
  "node_id": "660e8400-e29b-41d4-a716-446655440001",
  "vector_namespace": "moh-fiji-550e8400",
  "admin_invite_token": "inv_xxxxxxxxxxxxx"
}
```

### Get Organization Details

```bash
curl https://api.ratu.ai/v1/orgs/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

### List Organizations (Admin Only)

```bash
curl https://api.ratu.ai/v1/orgs \
  -H "Authorization: Bearer admin_token"
```

---

## 📚 Data Source Management

### Add Website Source

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "type": "website",
    "url": "https://health.gov.fj",
    "crawl_rules": {
      "max_depth": 3,
      "max_pages": 1000,
      "allowed_domains": ["health.gov.fj"],
      "exclude_patterns": ["/admin", "/login"],
      "follow_external_links": false
    }
  }'
```

**Response:**
```json
{
  "source_id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Add PDF Source

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "type": "pdf",
    "url": "https://health.gov.fj/policies/covid-guidelines.pdf"
  }'
```

### List Sources

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/sources \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

### Update Source

```bash
curl -X PATCH https://api.ratu.ai/v1/orgs/550e8400/sources/770e8400 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "status": "paused"
  }'
```

### Delete Source

```bash
curl -X DELETE https://api.ratu.ai/v1/orgs/550e8400/sources/770e8400 \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

---

## 🕷️ Crawling

### Trigger Full Crawl

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/sources/770e8400/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "mode": "full"
  }'
```

**Response:**
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "pending",
  "created_at": "2024-01-15T10:35:00Z"
}
```

### Trigger Delta Crawl (Changes Only)

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/sources/770e8400/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "mode": "delta"
  }'
```

### Get Crawl Job Status

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/crawl-jobs/880e8400 \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

**Response:**
```json
{
  "job_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "completed",
  "started_at": "2024-01-15T10:35:05Z",
  "finished_at": "2024-01-15T10:42:30Z",
  "stats": {
    "urls_scanned": 247,
    "new_docs": 15,
    "updated_docs": 8,
    "removed_docs": 2,
    "errors": 0
  }
}
```

### List Crawl Jobs

```bash
curl "https://api.ratu.ai/v1/orgs/550e8400/crawl-jobs?limit=10&status=completed" \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

---

## 📄 Document Management

### Manual Document Upload

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "uri": "manual://policy-2024.pdf",
    "title": "Health Policy 2024",
    "content": "Full text content here...",
    "metadata": {
      "author": "Ministry of Health",
      "date": "2024-01-15",
      "category": "policy"
    }
  }'
```

**Response:**
```json
{
  "doc_id": "990e8400-e29b-41d4-a716-446655440004",
  "chunks": 12,
  "embedded": true,
  "tokens": 3450
}
```

### List Documents

```bash
curl "https://api.ratu.ai/v1/orgs/550e8400/documents?limit=20&offset=0" \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

### Get Document Details

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/documents/990e8400 \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

### Delete Document

```bash
curl -X DELETE https://api.ratu.ai/v1/orgs/550e8400/documents/990e8400 \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

---

## 💬 Chat API

### Simple Chat

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "query": "What are the COVID-19 vaccination guidelines?",
    "top_k": 6,
    "citations": true
  }'
```

**Response:**
```json
{
  "session_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "message_id": "bb0e8400-e29b-41d4-a716-446655440006",
  "answer": "According to [CIT:990e8400:0], the COVID-19 vaccination guidelines state that all adults should receive two doses of the vaccine. [CIT:990e8400:1] specifies that the second dose should be administered 21 days after the first dose.",
  "citations": [
    {
      "doc_id": "990e8400-e29b-41d4-a716-446655440004",
      "chunk_ix": 0,
      "title": "COVID-19 Guidelines",
      "uri": "https://health.gov.fj/covid/guidelines",
      "snippet": "All adults should receive two doses...",
      "score": 0.92
    },
    {
      "doc_id": "990e8400-e29b-41d4-a716-446655440004",
      "chunk_ix": 1,
      "title": "COVID-19 Guidelines",
      "uri": "https://health.gov.fj/covid/guidelines",
      "snippet": "The second dose should be administered...",
      "score": 0.88
    }
  ],
  "usage": {
    "tokens_in": 150,
    "tokens_out": 85
  },
  "latency_ms": 1250
}
```

### Chat with Session Continuation

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "session_id": "aa0e8400-e29b-41d4-a716-446655440005",
    "query": "What about children under 12?",
    "top_k": 6,
    "citations": true
  }'
```

### Chat with Tools Enabled

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "query": "Search for the latest health statistics",
    "tools_enabled": true,
    "citations": true
  }'
```

### Streaming Chat

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "query": "Explain the health policy",
    "streaming": true
  }'
```

---

## 🏛️ Council (Multi-Agent)

### Run Council Analysis

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/council \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "query": "Analyze the budget allocation for healthcare in 2024",
    "roles": ["researcher", "analyst", "editor"],
    "strategy": "consensus",
    "tools_enabled": true
  }'
```

**Response:**
```json
{
  "session_id": "cc0e8400-e29b-41d4-a716-446655440007",
  "final": "Based on comprehensive analysis, the 2024 healthcare budget shows a 15% increase [CIT:doc1:5] with primary focus on rural health centers [CIT:doc2:3]...",
  "panel": [
    {
      "role": "Researcher",
      "notes": "Key findings from budget documents [CIT:doc1:5]: Total allocation is $45M, representing 15% increase from 2023...",
      "citations": [
        {
          "doc_id": "doc1",
          "chunk_ix": 5
        }
      ]
    },
    {
      "role": "Analyst",
      "notes": "Analysis indicates strategic shift toward preventive care [CIT:doc2:3]. The allocation breakdown shows...",
      "citations": [
        {
          "doc_id": "doc2",
          "chunk_ix": 3
        }
      ]
    },
    {
      "role": "Editor",
      "notes": "Synthesizing the findings: The budget demonstrates commitment to healthcare infrastructure with measurable targets...",
      "citations": []
    }
  ],
  "citations": [
    {
      "doc_id": "doc1",
      "chunk_ix": 5,
      "title": "2024 Budget Report",
      "uri": "https://health.gov.fj/budget/2024",
      "snippet": "Healthcare allocation: $45M..."
    }
  ],
  "usage": {
    "tokens_in": 850,
    "tokens_out": 420
  },
  "latency_ms": 3500
}
```

### Council with Critic Strategy

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/council \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "query": "Review the proposed health policy changes",
    "roles": ["researcher", "analyst", "editor", "critic"],
    "strategy": "critic"
  }'
```

---

## 🎤 Voice API

### Speech-to-Text

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/voice/stt \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -F "audio=@recording.mp3"
```

**Response:**
```json
{
  "text": "What are the COVID-19 vaccination guidelines?",
  "language": "en",
  "duration_seconds": 3.5
}
```

### Text-to-Speech

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/voice/tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "text": "The vaccination guidelines require two doses.",
    "voice": "neutral",
    "format": "mp3"
  }' \
  --output response.mp3
```

---

## 📊 Analytics

### Get Daily Metrics

```bash
curl "https://api.ratu.ai/v1/orgs/550e8400/analytics/daily?from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

**Response:**
```json
{
  "metrics": [
    {
      "date": "2024-01-15",
      "queries": 1247,
      "tokens_in": 187500,
      "tokens_out": 234000,
      "latency_ms_p50": 850,
      "latency_ms_p95": 2100,
      "crawled_docs": 15,
      "embeddings_count": 180,
      "cost_usd": 12.45
    }
  ]
}
```

### Get Real-Time Stats

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/analytics/realtime \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

### Export Analytics

```bash
curl "https://api.ratu.ai/v1/orgs/550e8400/analytics/export?format=csv&from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  --output analytics.csv
```

---

## 🔍 Audit Logs

### Get Audit Logs

```bash
curl "https://api.ratu.ai/v1/orgs/550e8400/audit?limit=50&action=source.created" \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

**Response:**
```json
{
  "items": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "actor_type": "user",
      "actor_id": "user_uuid",
      "action": "source.created",
      "target_type": "data_source",
      "target_id": "770e8400",
      "payload": {
        "type": "website",
        "url": "https://health.gov.fj"
      },
      "ip_address": "203.123.45.67",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "next_cursor": "cursor_token"
}
```

---

## 🔧 Tools Management

### Create Custom Tool

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/tools \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "name": "search_database",
    "description": "Search internal health database",
    "spec": {
      "type": "function",
      "function": {
        "name": "search_database",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Search query"
            }
          },
          "required": ["query"]
        }
      }
    },
    "enabled": true
  }'
```

### List Tools

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/tools \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

---

## 👥 User Management

### Invite User

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/users/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "email": "staff@health.gov.fj",
    "name": "Staff Member",
    "role": "EDITOR"
  }'
```

### List Users

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/users \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

### Update User Role

```bash
curl -X PATCH https://api.ratu.ai/v1/orgs/550e8400/users/user_uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "role": "ADMIN"
  }'
```

---

## 🔑 API Key Management

### Create API Key

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jwt_token" \
  -d '{
    "name": "Production Widget",
    "scope": ["chat", "voice"],
    "expires_in_days": 365
  }'
```

**Response:**
```json
{
  "key_id": "ee0e8400-e29b-41d4-a716-446655440009",
  "key": "ratu_key_xxxxxxxxxxxxxxxxxxxxx",
  "name": "Production Widget",
  "scope": ["chat", "voice"],
  "expires_at": "2025-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**⚠️ Important:** The `key` field is only shown once. Store it securely!

### List API Keys

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/api-keys \
  -H "Authorization: Bearer jwt_token"
```

### Revoke API Key

```bash
curl -X DELETE https://api.ratu.ai/v1/orgs/550e8400/api-keys/ee0e8400 \
  -H "Authorization: Bearer jwt_token"
```

---

## 🌐 Public Widget

### Get Embed Code

```bash
curl https://api.ratu.ai/v1/orgs/550e8400/widget/embed-code \
  -H "Authorization: Bearer ratu_key_xxxxx"
```

**Response:**
```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.ratu.ai/widget.js';
    script.setAttribute('data-org-id', '550e8400');
    script.setAttribute('data-api-key', 'ratu_key_public_xxxxx');
    document.head.appendChild(script);
  })();
</script>
```

---

## 🏥 Health Check

```bash
curl https://api.ratu.ai/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "vector_db": "healthy",
    "kimi_k2": "healthy"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📝 Rate Limits

Default rate limits per API key:

- **Chat**: 100 requests/minute
- **Council**: 20 requests/minute
- **Crawl**: 10 requests/hour
- **Ingest**: 1000 requests/hour
- **Analytics**: 100 requests/minute

Rate limit headers in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705318200
```

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "query",
      "issue": "Required field missing"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR` (401) - Invalid or missing API key
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMIT_ERROR` (429) - Rate limit exceeded
- `INTERNAL_ERROR` (500) - Server error

---

## 🔗 Webhooks (Coming Soon)

Configure webhooks to receive real-time notifications:

```bash
curl -X POST https://api.ratu.ai/v1/orgs/550e8400/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ratu_key_xxxxx" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["crawl.completed", "document.updated"],
    "secret": "your_webhook_secret"
  }'
```

---

**For more examples and interactive API testing, visit: https://docs.ratu.ai**