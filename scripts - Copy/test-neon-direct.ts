// scripts/test-neon-direct.ts
import { Pool } from 'pg';

async function testNeonDirect() {
  console.log('🔗 Testing Neon direct connection...');
  
  // Get your Neon connection string from dashboard
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://your_user:your_password@ep-cool-sound-123456.us-east-2.aws.neon.tech/neondb';
  
  console.log('Using connection:', connectionString.substring(0, 50) + '...');
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL Version:', result.rows[0].version);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    // More specific error checking
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('💡 DNS resolution failed. Check hostname in connection string.');
    } else if (error.message.includes('password authentication failed')) {
      console.log('💡 Authentication failed. Check username/password.');
    } else if (error.message.includes('SSL connection')) {
      console.log('💡 SSL issue. Make sure connection string ends with ?sslmode=require');
    }
  }
}

testNeonDirect().catch(console.error);