import { readFileSync } from 'fs';
import { join } from 'path';
import { createDatabase } from '../client';

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const db = createDatabase();

  try {
    // Check connection
    const isConnected = await db.ping();
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    console.log('✅ Database connection established');

    // Read schema file
    const schemaPath = join(__dirname, '../../../core/src/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await db.query(schema);

    console.log('✅ Schema applied successfully');
    console.log('✅ All migrations complete');

    await db.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    await db.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };