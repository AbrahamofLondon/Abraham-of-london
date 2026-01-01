// scripts/test-db.ts
import { DatabaseClient } from '@/lib/server/inner-circle';

async function testDatabase() {
  console.log('Testing database connection...');
  
  await DatabaseClient.initialize();
  
  // Test query
  const result = await DatabaseClient.query(
    'test',
    'SELECT version() as version, NOW() as time',
    [],
    null
  );
  
  if (result) {
    console.log('✅ Database connected successfully!');
    console.log('PostgreSQL Version:', result.version);
    console.log('Server Time:', result.time);
  } else {
    console.log('⚠️  Database in stub mode (no real connection)');
  }
  
  // Test health check
  const health = await DatabaseClient.healthCheck();
  console.log('Health Check:', health);
}

testDatabase().catch(console.error);