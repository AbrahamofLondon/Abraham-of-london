// scripts/test-neon-final.ts
import { Pool } from 'pg';

async function testNeonFinal() {
  console.log('🔗 Final Neon connection test...');
  
  // Load from environment or use direct string
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_lVTc95DapNuM@ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech/abraham_of_london?sslmode=require';
  
  console.log('Host:', connectionString.split('@')[1]?.split('/')[0]);
  console.log('Database:', connectionString.split('/').pop()?.split('?')[0]);
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon!');
    
    // Test 1: Basic connection
    const version = await client.query('SELECT version()');
    console.log('PostgreSQL:', version.rows[0].version.split(',')[0]);
    
    // Test 2: Check your inner circle tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Your Inner Circle tables:');
    tables.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });
    
    // Test 3: Try to query one of your tables
    if (tables.rows.some(t => t.table_name === 'inner_circle_members')) {
      const count = await client.query('SELECT COUNT(*) as member_count FROM inner_circle_members');
      console.log(`\n👥 Members in database: ${count.rows[0].member_count}`);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 SUCCESS! Your Neon database is fully connected.');
    console.log('The .env.local file should now work with your DatabaseClient.');
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n🔑 Authentication failed - double check password');
    } else if (error.message.includes('does not support SSL')) {
      console.log('\n🔒 SSL issue - make sure connection string has ?sslmode=require');
      console.log('Current string start:', connectionString.substring(0, 100));
    }
  }
}

testNeonFinal().catch(console.error);