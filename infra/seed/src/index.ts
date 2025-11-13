import dotenv from 'dotenv';
import { createDatabase, OrganizationRepository } from '@ratu/db';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');
  
  const db = createDatabase();
  const orgRepo = new OrganizationRepository(db);

  try {
    // Create demo organization
    console.log('Creating demo organization...');
    const demoOrg = await orgRepo.create({
      name: 'Demo Organization',
      slug: 'demo',
      settings: {
        theme: 'light',
        language: 'en',
      },
    });

    console.log('✅ Demo organization created:', demoOrg.org_id);

    // Create sample node
    console.log('Creating demo node...');
    const nodeId = uuidv4();
    await db.query(
      `INSERT INTO nodes (node_id, org_id, name, vector_namespace, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [nodeId, demoOrg.org_id, 'Main Node', `demo-${nodeId.substring(0, 8)}`, 'active']
    );

    console.log('✅ Demo node created:', nodeId);

    // Create admin user
    console.log('Creating admin user...');
    const userId = uuidv4();
    await db.query(
      `INSERT INTO users (user_id, org_id, email, name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, demoOrg.org_id, 'admin@demo.com', 'Admin User', 'OWNER', 'active']
    );

    console.log('✅ Admin user created:', userId);

    // Create API key
    console.log('Creating API key...');
    const apiKeyId = uuidv4();
    const apiKey = `ratu_demo_${uuidv4().replace(/-/g, '')}`;
    await db.query(
      `INSERT INTO api_keys (key_id, org_id, name, key_hash, scope, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [apiKeyId, demoOrg.org_id, 'Demo API Key', apiKey, ['*'], 'active']
    );

    console.log('✅ API key created');
    console.log('📋 API Key:', apiKey);
    console.log('⚠️  Save this key - it won\'t be shown again!');

    // Create sample data source
    console.log('Creating sample data source...');
    const sourceId = uuidv4();
    await db.query(
      `INSERT INTO data_sources (source_id, org_id, type, url, crawl_rules, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sourceId,
        demoOrg.org_id,
        'website',
        'https://example.com',
        { max_depth: 2, max_pages: 50 },
        'pending'
      ]
    );

    console.log('✅ Sample data source created:', sourceId);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Seed data created successfully!');
    console.log('='.repeat(50));
    console.log('Organization ID:', demoOrg.org_id);
    console.log('Node ID:', nodeId);
    console.log('User ID:', userId);
    console.log('API Key:', apiKey);
    console.log('Source ID:', sourceId);
    console.log('='.repeat(50));

    await db.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
    await db.close();
    process.exit(1);
  }
}

// Run seed
seed();