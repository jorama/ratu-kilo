-- =========================
-- RATU SOVEREIGN AI - DATABASE SCHEMA
-- =========================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- ORGANIZATIONS & NODES
-- =========================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);

CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(50) NOT NULL DEFAULT 'default',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  vector_namespace VARCHAR(255) NOT NULL UNIQUE,
  config_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_nodes_org_id ON nodes(org_id);
CREATE INDEX idx_nodes_vector_namespace ON nodes(vector_namespace);

-- =========================
-- USERS & AUTHENTICATION
-- =========================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'BOT')),
  status VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'suspended')),
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  UNIQUE(org_id, email)
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hashed_key VARCHAR(255) NOT NULL UNIQUE,
  scope TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_hashed_key ON api_keys(hashed_key);

-- =========================
-- DATA SOURCES
-- =========================

CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('website', 'pdf', 's3', 'gdrive', 'manual')),
  url TEXT,
  auth_json JSONB,
  crawl_rules_json JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_crawled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_sources_org_id ON data_sources(org_id);
CREATE INDEX idx_data_sources_type ON data_sources(type);

-- =========================
-- DOCUMENTS & CHUNKS
-- =========================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
  uri TEXT NOT NULL,
  title TEXT NOT NULL,
  lang VARCHAR(10) NOT NULL DEFAULT 'en',
  version INTEGER NOT NULL DEFAULT 1,
  checksum VARCHAR(64) NOT NULL,
  mime_type VARCHAR(100),
  metadata_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  UNIQUE(org_id, uri)
);

CREATE INDEX idx_documents_org_id ON documents(org_id);
CREATE INDEX idx_documents_source_id ON documents(source_id);
CREATE INDEX idx_documents_checksum ON documents(checksum);

CREATE TABLE doc_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doc_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_ix INTEGER NOT NULL,
  content TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  hash VARCHAR(64) NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(doc_id, chunk_ix)
);

CREATE INDEX idx_doc_chunks_org_id ON doc_chunks(org_id);
CREATE INDEX idx_doc_chunks_doc_id ON doc_chunks(doc_id);

CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL REFERENCES doc_chunks(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  dimensions INTEGER NOT NULL,
  vector_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(chunk_id, provider, model)
);

CREATE INDEX idx_embeddings_org_id ON embeddings(org_id);
CREATE INDEX idx_embeddings_chunk_id ON embeddings(chunk_id);

-- =========================
-- CRAWL JOBS & EVENTS
-- =========================

CREATE TABLE crawl_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('full', 'delta')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  stats_json JSONB,
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawl_jobs_org_id ON crawl_jobs(org_id);
CREATE INDEX idx_crawl_jobs_source_id ON crawl_jobs(source_id);
CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);

CREATE TABLE crawl_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('discovered', 'updated', 'removed', 'error')),
  uri TEXT NOT NULL,
  detail_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawl_events_org_id ON crawl_events(org_id);
CREATE INDEX idx_crawl_events_job_id ON crawl_events(job_id);
CREATE INDEX idx_crawl_events_type ON crawl_events(type);

-- =========================
-- CHAT SESSIONS & MESSAGES
-- =========================

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('public', 'internal', 'council')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_org_id ON chat_sessions(org_id);
CREATE INDEX idx_chat_sessions_kind ON chat_sessions(kind);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  tool_calls_json JSONB,
  citations_json JSONB,
  metadata_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_org_id ON messages(org_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);

-- =========================
-- TOOLS & AGENTS
-- =========================

CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  spec_json JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX idx_tools_org_id ON tools(org_id);
CREATE INDEX idx_tools_enabled ON tools(enabled);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  kind VARCHAR(50) NOT NULL CHECK (kind IN ('researcher', 'analyst', 'editor', 'critic', 'voice', 'custom')),
  config_json JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX idx_agents_org_id ON agents(org_id);
CREATE INDEX idx_agents_kind ON agents(kind);

-- =========================
-- AUDIT LOGS
-- =========================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'system', 'api_key')),
  actor_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  payload_json JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =========================
-- ANALYTICS & METRICS
-- =========================

CREATE TABLE metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  queries INTEGER NOT NULL DEFAULT 0,
  tokens_in BIGINT NOT NULL DEFAULT 0,
  tokens_out BIGINT NOT NULL DEFAULT 0,
  latency_ms_p50 INTEGER,
  latency_ms_p95 INTEGER,
  crawled_docs INTEGER NOT NULL DEFAULT 0,
  embeddings_count INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, date)
);

CREATE INDEX idx_metrics_daily_org_id ON metrics_daily(org_id);
CREATE INDEX idx_metrics_daily_date ON metrics_daily(date);

CREATE TABLE model_integrity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_name VARCHAR(100) NOT NULL,
  model_checksum VARCHAR(64) NOT NULL,
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  proof_json JSONB
);

CREATE INDEX idx_model_integrity_org_id ON model_integrity(org_id);
CREATE INDEX idx_model_integrity_verified_at ON model_integrity(verified_at);

-- =========================
-- BILLING
-- =========================

CREATE TABLE billing_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  billing_email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_accounts_org_id ON billing_accounts(org_id);

CREATE TABLE usage_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(12, 4) NOT NULL,
  cost_usd DECIMAL(10, 6) NOT NULL,
  metadata_json JSONB
);

CREATE INDEX idx_usage_ledger_org_id ON usage_ledger(org_id);
CREATE INDEX idx_usage_ledger_timestamp ON usage_ledger(timestamp);

-- =========================
-- FUNCTIONS & TRIGGERS
-- =========================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- INITIAL DATA
-- =========================

-- This will be populated by seed scripts