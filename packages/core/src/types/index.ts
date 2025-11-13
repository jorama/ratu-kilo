import { z } from 'zod';

// =========================
// ORGANIZATION & NODE TYPES
// =========================

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(['active', 'suspended', 'deleted']),
  created_at: z.date(),
  updated_at: z.date().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const NodeSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string(),
  region: z.string(),
  status: z.enum(['active', 'suspended', 'deleted']),
  vector_namespace: z.string(),
  config_json: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date().optional(),
});

export type Node = z.infer<typeof NodeSchema>;

// =========================
// USER & AUTH TYPES
// =========================

export const UserRoleSchema = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'BOT']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  status: z.enum(['active', 'invited', 'suspended']),
  password_hash: z.string().optional(),
  created_at: z.date(),
  last_login_at: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string(),
  hashed_key: z.string(),
  scope: z.array(z.string()),
  status: z.enum(['active', 'revoked']),
  created_at: z.date(),
  last_used_at: z.date().optional(),
  expires_at: z.date().optional(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// =========================
// DATA SOURCE TYPES
// =========================

export const DataSourceTypeSchema = z.enum(['website', 'pdf', 's3', 'gdrive', 'manual']);
export type DataSourceType = z.infer<typeof DataSourceTypeSchema>;

export const DataSourceSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  type: DataSourceTypeSchema,
  url: z.string().optional(),
  auth_json: z.record(z.any()).optional(),
  crawl_rules_json: z.record(z.any()).optional(),
  status: z.enum(['active', 'paused', 'error']),
  last_crawled_at: z.date().optional(),
  created_at: z.date(),
});

export type DataSource = z.infer<typeof DataSourceSchema>;

// =========================
// DOCUMENT TYPES
// =========================

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  source_id: z.string().uuid().optional(),
  uri: z.string(),
  title: z.string(),
  lang: z.string().default('en'),
  version: z.number().default(1),
  checksum: z.string(),
  mime_type: z.string().optional(),
  metadata_json: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const DocChunkSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  doc_id: z.string().uuid(),
  chunk_ix: z.number(),
  content: z.string(),
  tokens: z.number(),
  hash: z.string(),
  metadata_json: z.record(z.any()).optional(),
  created_at: z.date(),
});

export type DocChunk = z.infer<typeof DocChunkSchema>;

export const EmbeddingSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  chunk_id: z.string().uuid(),
  provider: z.string(),
  model: z.string(),
  dimensions: z.number(),
  vector: z.array(z.number()),
  created_at: z.date(),
});

export type Embedding = z.infer<typeof EmbeddingSchema>;

// =========================
// CRAWL JOB TYPES
// =========================

export const CrawlJobSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  source_id: z.string().uuid(),
  mode: z.enum(['full', 'delta']),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  started_at: z.date().optional(),
  finished_at: z.date().optional(),
  stats_json: z.record(z.any()).optional(),
  error: z.string().optional(),
  created_at: z.date(),
});

export type CrawlJob = z.infer<typeof CrawlJobSchema>;

export const CrawlEventSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  job_id: z.string().uuid(),
  type: z.enum(['discovered', 'updated', 'removed', 'error']),
  uri: z.string(),
  detail_json: z.record(z.any()).optional(),
  created_at: z.date(),
});

export type CrawlEvent = z.infer<typeof CrawlEventSchema>;

// =========================
// CHAT TYPES
// =========================

export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  kind: z.enum(['public', 'internal', 'council']),
  created_by: z.string().uuid().optional(),
  metadata_json: z.record(z.any()).optional(),
  created_at: z.date(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const MessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  tool_calls_json: z.array(z.any()).optional(),
  citations_json: z.array(z.any()).optional(),
  metadata_json: z.record(z.any()).optional(),
  created_at: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

// =========================
// TOOL & AGENT TYPES
// =========================

export const ToolSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  spec_json: z.record(z.any()),
  enabled: z.boolean().default(true),
  created_at: z.date(),
});

export type Tool = z.infer<typeof ToolSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string(),
  kind: z.enum(['researcher', 'analyst', 'editor', 'critic', 'voice', 'custom']),
  config_json: z.record(z.any()),
  enabled: z.boolean().default(true),
  created_at: z.date(),
});

export type Agent = z.infer<typeof AgentSchema>;

// =========================
// AUDIT & ANALYTICS TYPES
// =========================

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  actor_type: z.enum(['user', 'system', 'api_key']),
  actor_id: z.string().uuid(),
  action: z.string(),
  target_type: z.string().optional(),
  target_id: z.string().uuid().optional(),
  payload_json: z.record(z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  created_at: z.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const MetricsDailySchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  date: z.date(),
  queries: z.number().default(0),
  tokens_in: z.number().default(0),
  tokens_out: z.number().default(0),
  latency_ms_p50: z.number().optional(),
  latency_ms_p95: z.number().optional(),
  crawled_docs: z.number().default(0),
  embeddings_count: z.number().default(0),
  cost_usd: z.number().default(0),
  created_at: z.date(),
});

export type MetricsDaily = z.infer<typeof MetricsDailySchema>;

export const ModelIntegritySchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  model_name: z.string(),
  model_checksum: z.string(),
  verified_at: z.date(),
  proof_json: z.record(z.any()).optional(),
});

export type ModelIntegrity = z.infer<typeof ModelIntegritySchema>;

// =========================
// BILLING TYPES
// =========================

export const BillingAccountSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
  status: z.enum(['active', 'suspended', 'cancelled']),
  billing_email: z.string().email().optional(),
  created_at: z.date(),
});

export type BillingAccount = z.infer<typeof BillingAccountSchema>;

export const UsageLedgerSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  timestamp: z.date(),
  unit: z.string(),
  quantity: z.number(),
  cost_usd: z.number(),
  metadata_json: z.record(z.any()).optional(),
});

export type UsageLedger = z.infer<typeof UsageLedgerSchema>;

// =========================
// API REQUEST/RESPONSE TYPES
// =========================

export const CreateOrgRequestSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  admin_email: z.string().email(),
});

export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>;

export const CreateOrgResponseSchema = z.object({
  org_id: z.string().uuid(),
  node_id: z.string().uuid(),
  vector_namespace: z.string(),
  admin_invite_token: z.string(),
});

export type CreateOrgResponse = z.infer<typeof CreateOrgResponseSchema>;

export const ChatRequestSchema = z.object({
  session_id: z.string().uuid().optional(),
  query: z.string().min(1),
  top_k: z.number().default(6),
  tools_enabled: z.boolean().default(true),
  council: z.boolean().default(false),
  streaming: z.boolean().default(false),
  citations: z.boolean().default(true),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const CitationSchema = z.object({
  doc_id: z.string().uuid(),
  chunk_ix: z.number(),
  title: z.string(),
  uri: z.string(),
  snippet: z.string(),
  score: z.number().optional(),
});

export type Citation = z.infer<typeof CitationSchema>;

export const ChatResponseSchema = z.object({
  session_id: z.string().uuid(),
  message_id: z.string().uuid(),
  answer: z.string(),
  citations: z.array(CitationSchema).optional(),
  steps: z.array(z.any()).optional(),
  usage: z.object({
    tokens_in: z.number(),
    tokens_out: z.number(),
  }),
  latency_ms: z.number(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const CouncilRequestSchema = z.object({
  session_id: z.string().uuid().optional(),
  query: z.string().min(1),
  roles: z.array(z.string()).default(['researcher', 'analyst', 'editor']),
  strategy: z.enum(['deliberate', 'consensus', 'critic']).default('consensus'),
  tools_enabled: z.boolean().default(true),
});

export type CouncilRequest = z.infer<typeof CouncilRequestSchema>;

export const CouncilResponseSchema = z.object({
  session_id: z.string().uuid(),
  final: z.string(),
  panel: z.array(z.object({
    role: z.string(),
    notes: z.string(),
    citations: z.array(CitationSchema).optional(),
  })),
  citations: z.array(CitationSchema),
  usage: z.object({
    tokens_in: z.number(),
    tokens_out: z.number(),
  }),
  latency_ms: z.number(),
});

export type CouncilResponse = z.infer<typeof CouncilResponseSchema>;

// =========================
// ERROR TYPES
// =========================

export class RatuError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'RatuError';
  }
}

export class ValidationError extends RatuError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends RatuError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends RatuError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends RatuError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends RatuError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

export class FileRestrictionError extends RatuError {
  constructor(message: string, allowedPatterns: string[]) {
    super(message, 'FILE_RESTRICTION_ERROR', 403, { allowedPatterns });
    this.name = 'FileRestrictionError';
  }
}