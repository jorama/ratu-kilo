# 🛠️ Ratu Sovereign AI - Implementation Guide

This guide provides step-by-step instructions for implementing the remaining components of Ratu Sovereign AI.

## 📋 Implementation Checklist

### ✅ Completed
- [x] Monorepo structure
- [x] Core types and database schema
- [x] Kimi K2 client wrapper
- [x] Council multi-agent system
- [x] Environment configuration
- [x] Docker Compose setup

### 🚧 To Implement

#### 1. RAG Pipeline (`packages/rag/`)
- [ ] Chunking engine
- [ ] Embedding service
- [ ] Vector store client
- [ ] Retrieval engine
- [ ] Context builder

#### 2. Discovery Agents (`packages/discovery/`)
- [ ] Website crawler
- [ ] PDF extractor
- [ ] Content parser
- [ ] Diff engine
- [ ] Provenance logger

#### 3. Voice Layer (`packages/voice/`)
- [ ] STT adapter (Whisper/Deepgram)
- [ ] TTS adapter (ElevenLabs/OpenAI)
- [ ] Audio processing

#### 4. Auth Package (`packages/auth/`)
- [ ] JWT service
- [ ] API key management
- [ ] RBAC middleware
- [ ] Session management

#### 5. Audit Package (`packages/audit/`)
- [ ] Audit log writer
- [ ] Event schemas
- [ ] Query interface

#### 6. Analytics Package (`packages/analytics/`)
- [ ] Metrics collector
- [ ] Daily rollup
- [ ] Cost calculator

#### 7. API Gateway (`apps/api/`)
- [ ] Express/Fastify server
- [ ] Route handlers
- [ ] WebSocket support
- [ ] Rate limiting
- [ ] Error handling

#### 8. Worker (`apps/worker/`)
- [ ] Bull/BullMQ queue
- [ ] Job processors
- [ ] Scheduler

#### 9. Dashboards (`apps/dashboard/`, `apps/console/`)
- [ ] Next.js/React setup
- [ ] UI components
- [ ] API integration

#### 10. Public Widget (`apps/publicbot/`)
- [ ] Embeddable script
- [ ] Chat UI
- [ ] API client

---

## 🔨 Detailed Implementation Steps

### 1. RAG Pipeline Implementation

**File: `packages/rag/src/chunker.ts`**

```typescript
export interface ChunkOptions {
  targetTokens: number;
  overlap: number;
  preserveParagraphs?: boolean;
}

export class Chunker {
  chunk(text: string, options: ChunkOptions): string[] {
    // Implement text chunking with overlap
    // Use tiktoken or similar for token counting
    // Preserve paragraph boundaries if requested
  }
}
```

**File: `packages/rag/src/embeddings.ts`**

```typescript
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
}

export class OpenAIEmbeddings implements EmbeddingProvider {
  async embed(texts: string[]): Promise<number[][]> {
    // Call OpenAI embeddings API
    // Handle batching and rate limits
  }
}
```

**File: `packages/rag/src/vector-store.ts`**

```typescript
export interface VectorStore {
  upsert(namespace: string, vectors: Vector[]): Promise<void>;
  query(namespace: string, vector: number[], topK: number): Promise<Match[]>;
  delete(namespace: string, ids: string[]): Promise<void>;
}

export class QdrantStore implements VectorStore {
  // Implement Qdrant client
}
```

**File: `packages/rag/src/retriever.ts`**

```typescript
export class Retriever {
  async retrieve(
    orgId: string,
    query: string,
    options: { topK: number }
  ): Promise<RetrievedChunk[]> {
    // 1. Embed query
    // 2. Search vector store
    // 3. Fetch chunk metadata from DB
    // 4. Return ranked results
  }
}
```

### 2. Discovery Agents Implementation

**File: `packages/discovery/src/crawler.ts`**

```typescript
export class WebCrawler {
  async crawl(source: DataSource, mode: 'full' | 'delta'): Promise<CrawlResult> {
    // 1. Respect robots.txt
    // 2. Follow sitemap
    // 3. Extract links
    // 4. Download pages
    // 5. Detect changes (for delta mode)
    // 6. Emit events
  }
}
```

**File: `packages/discovery/src/extractors/pdf.ts`**

```typescript
export class PDFExtractor {
  async extract(buffer: Buffer): Promise<ExtractedContent> {
    // Use pdf-parse or similar
    // Extract text, metadata, images
  }
}
```

**File: `packages/discovery/src/diff-engine.ts`**

```typescript
export class DiffEngine {
  computeDiff(
    oldDoc: Document,
    newDoc: Document
  ): { type: 'new' | 'updated' | 'removed'; changes: any } {
    // Compare checksums
    // Identify changes
    // Generate provenance events
  }
}
```

### 3. Voice Layer Implementation

**File: `packages/voice/src/stt.ts`**

```typescript
export interface STTProvider {
  transcribe(audio: Buffer): Promise<string>;
}

export class WhisperSTT implements STTProvider {
  async transcribe(audio: Buffer): Promise<string> {
    // Call Whisper API
    // Handle audio formats
  }
}
```

**File: `packages/voice/src/tts.ts`**

```typescript
export interface TTSProvider {
  synthesize(text: string, voice?: string): Promise<Buffer>;
}

export class OpenAITTS implements TTSProvider {
  async synthesize(text: string, voice = 'alloy'): Promise<Buffer> {
    // Call OpenAI TTS API
    // Return audio buffer
  }
}
```

### 4. Auth Package Implementation

**File: `packages/auth/src/jwt.ts`**

```typescript
export class JWTService {
  sign(payload: any, expiresIn: string): string {
    // Use jsonwebtoken
  }

  verify(token: string): any {
    // Verify and decode
  }
}
```

**File: `packages/auth/src/api-keys.ts`**

```typescript
export class ApiKeyService {
  async generate(orgId: string, name: string, scope: string[]): Promise<string> {
    // Generate random key
    // Hash and store
    // Return plain key (only time visible)
  }

  async verify(key: string): Promise<ApiKey | null> {
    // Hash key
    // Lookup in DB
    // Update last_used_at
  }
}
```

**File: `packages/auth/src/rbac.ts`**

```typescript
export class RBACMiddleware {
  checkPermission(role: UserRole, action: string, resource: string): boolean {
    // Define permission matrix
    // Check if role can perform action on resource
  }
}
```

### 5. API Gateway Implementation

**File: `apps/api/src/server.ts`**

```typescript
import express from 'express';
import { createKimiClient } from '@ratu/llm';
import { createRAGPipeline } from '@ratu/rag';

const app = express();

app.post('/v1/orgs/:orgId/chat', async (req, res) => {
  const { orgId } = req.params;
  const { query, top_k = 6 } = req.body;

  // 1. Authenticate
  // 2. Retrieve context
  const rag = createRAGPipeline(orgId);
  const chunks = await rag.retrieve(query, { topK: top_k });
  const context = rag.buildContext(chunks);

  // 3. Call Kimi K2
  const kimi = createKimiClient();
  const systemPrompt = KimiK2Client.buildRatuSystemPrompt(orgName, context);
  const response = await kimi.complete(query, systemPrompt);

  // 4. Parse citations
  const citations = kimi.parseCitations(response);

  // 5. Store message
  // 6. Update metrics
  // 7. Return response
  res.json({ answer: response, citations });
});
```

### 6. Worker Implementation

**File: `apps/worker/src/jobs/crawl.ts`**

```typescript
import { Job } from 'bull';

export async function processCrawlJob(job: Job) {
  const { orgId, sourceId, mode } = job.data;

  // 1. Fetch source config
  // 2. Initialize crawler
  // 3. Run crawl
  // 4. Process each page:
  //    - Extract content
  //    - Chunk text
  //    - Embed chunks
  //    - Upsert to vector store
  // 5. Update job status
  // 6. Log events
}
```

### 7. Dashboard Implementation

**File: `apps/dashboard/src/pages/index.tsx`**

```typescript
export default function Dashboard() {
  const { data: metrics } = useMetrics();
  const { data: sources } = useSources();

  return (
    <div>
      <MetricsOverview metrics={metrics} />
      <SourcesList sources={sources} />
      <ChatStudio />
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// packages/llm/src/__tests__/kimi-client.test.ts
describe('KimiK2Client', () => {
  it('should complete text', async () => {
    const client = createKimiClient();
    const result = await client.complete('Hello');
    expect(result).toBeTruthy();
  });

  it('should parse citations', () => {
    const client = createKimiClient();
    const text = 'According to [CIT:doc1:0], the policy states...';
    const citations = client.parseCitations(text);
    expect(citations).toHaveLength(1);
    expect(citations[0].docId).toBe('doc1');
  });
});
```

### Integration Tests

```typescript
// apps/api/src/__tests__/chat.integration.test.ts
describe('Chat API', () => {
  it('should return cited answer', async () => {
    const response = await request(app)
      .post('/v1/orgs/test-org/chat')
      .send({ query: 'What is the policy?' })
      .expect(200);

    expect(response.body.answer).toBeTruthy();
    expect(response.body.citations).toBeInstanceOf(Array);
  });
});
```

---

## 📦 Package Dependencies

### Core Dependencies to Add

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "fastify": "^4.25.2",
    "bull": "^4.12.0",
    "ioredis": "^5.3.2",
    "pg": "^8.11.3",
    "axios": "^1.6.5",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "tiktoken": "^1.0.10",
    "pdf-parse": "^1.1.1",
    "cheerio": "^1.0.0-rc.12",
    "robots-parser": "^3.0.1",
    "sitemap": "^7.1.1"
  }
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Test Kimi K2 API connection
- [ ] Test vector database connection
- [ ] Configure object storage
- [ ] Set up monitoring (Sentry, etc.)

### Deployment Steps

1. **Build all packages**
   ```bash
   npm run build
   ```

2. **Run migrations**
   ```bash
   npm run db:migrate
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Verify health**
   ```bash
   curl http://localhost:3001/health
   ```

5. **Create first organization**
   ```bash
   curl -X POST http://localhost:3001/v1/orgs \
     -H "Content-Type: application/json" \
     -d '{"name": "Demo Org", "slug": "demo"}'
   ```

---

## 🔍 Debugging Tips

### Common Issues

**1. Kimi K2 API Errors**
- Check API key is valid
- Verify API base URL
- Check rate limits
- Review request/response logs

**2. Vector Store Connection**
- Ensure Qdrant is running
- Check network connectivity
- Verify collection exists
- Check namespace isolation

**3. Embedding Failures**
- Verify embedding API key
- Check text length limits
- Review batch sizes
- Monitor rate limits

**4. Crawl Issues**
- Check robots.txt compliance
- Verify URL accessibility
- Review crawl rules
- Check timeout settings

---

## 📚 Additional Resources

### Documentation to Create

1. **API Reference** - OpenAPI/Swagger spec
2. **Architecture Diagrams** - System design docs
3. **Deployment Guide** - Production setup
4. **Security Guide** - Best practices
5. **Troubleshooting** - Common issues

### Tools to Integrate

1. **Monitoring**: Prometheus + Grafana
2. **Logging**: ELK Stack or Loki
3. **Tracing**: Jaeger or Zipkin
4. **Alerting**: PagerDuty or Opsgenie

---

## 🎯 Next Steps

1. **Implement RAG pipeline** - Start with chunking and embeddings
2. **Build API gateway** - Core endpoints first
3. **Create worker** - Crawl job processor
4. **Add authentication** - JWT and API keys
5. **Build dashboard** - Basic UI for testing
6. **Add monitoring** - Metrics and logs
7. **Write tests** - Unit and integration
8. **Deploy to staging** - Test end-to-end
9. **Production deployment** - Go live!

---

## 💡 Pro Tips

1. **Start Simple**: Implement core features first, add complexity later
2. **Test Early**: Write tests as you build, not after
3. **Monitor Everything**: Add logging and metrics from day one
4. **Document As You Go**: Update docs with each feature
5. **Use Feature Flags**: Enable/disable features without deployment
6. **Optimize Later**: Get it working first, then optimize
7. **Security First**: Never skip auth/validation
8. **Think Multi-Tenant**: Always include org_id in queries

---

**Ready to build? Start with the RAG pipeline and work your way up!** 🚀