import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createDatabase, OrganizationRepository } from '@ratu/db';
import { createRAGPipeline } from '@ratu/rag';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function setupMarketingBot() {
  console.log('🤖 Setting up Ratu Marketing Chatbot...');
  
  const db = createDatabase();
  const orgRepo = new OrganizationRepository(db);

  try {
    // 1. Create marketing organization
    console.log('Creating marketing organization...');
    const marketingOrg = await orgRepo.create({
      name: 'Ratu Marketing',
      slug: 'ratu-marketing',
      settings: {
        theme: 'light',
        bot_enabled: true,
        bot_greeting: 'Hi! I\'m Ratu, your AI assistant. How can I help you learn about Ratu Sovereign AI?',
      },
    });

    console.log('✅ Marketing organization created:', marketingOrg.org_id);

    // 2. Create marketing node
    const nodeId = uuidv4();
    await db.query(
      `INSERT INTO nodes (node_id, org_id, name, vector_namespace, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [nodeId, marketingOrg.org_id, 'Marketing Bot', `marketing-${nodeId.substring(0, 8)}`, 'active']
    );

    console.log('✅ Marketing node created:', nodeId);

    // 3. Create bot API key
    const apiKeyId = uuidv4();
    const apiKey = `ratu_marketing_${uuidv4().replace(/-/g, '')}`;
    await db.query(
      `INSERT INTO api_keys (key_id, org_id, name, key_hash, scope, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [apiKeyId, marketingOrg.org_id, 'Marketing Bot API Key', apiKey, ['chat:*'], 'active']
    );

    console.log('✅ Marketing bot API key created');
    console.log('📋 API Key:', apiKey);
    console.log('⚠️  Add this to your .env as NEXT_PUBLIC_RATU_WIDGET_KEY');

    // 4. Load knowledge base
    console.log('Loading marketing knowledge base...');
    const knowledgePath = join(__dirname, 'ratu-marketing-knowledge.md');
    const knowledge = readFileSync(knowledgePath, 'utf-8');

    // 5. Ingest into RAG
    const rag = createRAGPipeline(marketingOrg.org_id, `marketing-${nodeId.substring(0, 8)}`);
    
    const docId = uuidv4();
    const result = await rag.ingest({
      id: docId,
      orgId: marketingOrg.org_id,
      uri: 'internal://marketing-knowledge',
      title: 'Ratu Sovereign AI - Complete Guide',
      content: knowledge,
      metadata: {
        type: 'marketing',
        version: '1.0.0',
      },
    });

    console.log('✅ Knowledge base ingested:');
    console.log(`   - Document ID: ${docId}`);
    console.log(`   - Chunks: ${result.chunks}`);
    console.log(`   - Tokens: ${result.tokens}`);

    // 6. Create sample data source
    const sourceId = uuidv4();
    await db.query(
      `INSERT INTO data_sources (source_id, org_id, type, url, crawl_rules, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sourceId,
        marketingOrg.org_id,
        'website',
        'https://ratu.ai',
        { max_depth: 2, max_pages: 50 },
        'active'
      ]
    );

    console.log('✅ Sample data source created');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Marketing Chatbot Setup Complete!');
    console.log('='.repeat(60));
    console.log('Organization ID:', marketingOrg.org_id);
    console.log('Node ID:', nodeId);
    console.log('API Key:', apiKey);
    console.log('Knowledge Chunks:', result.chunks);
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('1. Add API key to .env: NEXT_PUBLIC_RATU_WIDGET_KEY=' + apiKey);
    console.log('2. Start the website: cd apps/website && npm run dev');
    console.log('3. Visit http://localhost:3000');
    console.log('4. Chat widget will appear in bottom-right corner');
    console.log('5. Ask questions about Ratu!');
    console.log('='.repeat(60));

    await db.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    await db.close();
    process.exit(1);
  }
}

// Run setup
setupMarketingBot();