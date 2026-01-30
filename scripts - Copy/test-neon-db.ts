// scripts/test-neon-db.ts - UPDATED DEBUG VERSION
import { DatabaseClient } from '@/lib/server/inner-circle';

async function testNeonConnection() {
  console.log('🔗 Testing Neon database connection...');
  
  // Debug: Show what environment variables are loaded
  console.log('📋 Environment check:');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
  console.log('  DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('  DB_NAME:', process.env.DB_NAME || 'NOT SET');
  console.log('  DB_USER:', process.env.DB_USER || 'NOT SET');
  console.log('  DB_SSL:', process.env.DB_SSL || 'NOT SET');
  
  try {
    // Initialize with explicit Neon config
    await DatabaseClient.initialize({
      // Try connection string first
      connectionString: process.env.DATABASE_URL,
      // Fallback to individual config
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }, // Force Neon SSL config
    });
    
    console.log('✅ DatabaseClient initialized');
    
    // Simple test query
    const result = await DatabaseClient.query(
      'neon_test',
      'SELECT 1 as test_value, current_timestamp as now',
      [],
      null
    );
    
    if (result) {
      console.log('🎉 Success! Connected to Neon database');
      console.log('   Test query result:', result);
    } else {
      console.log('⚠️  Query returned null (running in stub mode)');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    // Provide troubleshooting tips
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your .env.local file exists in project root');
    console.log('2. Verify Neon credentials are correct');
    console.log('3. Try the connection string format from Neon dashboard');
    console.log('4. Check if your IP is whitelisted in Neon');
  } finally {
    await DatabaseClient.close();
  }
}

testNeonConnection().catch(console.error);