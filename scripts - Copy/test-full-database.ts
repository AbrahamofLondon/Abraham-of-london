// scripts/test-full-database.ts
import { DatabaseClient } from '@/lib/server/inner-circle';

async function testFullDatabase() {
  console.log('🧪 Testing DatabaseClient with Neon tables...');
  
  try {
    // Initialize DatabaseClient
    await DatabaseClient.initialize();
    console.log('✅ DatabaseClient initialized');
    
    // Test 1: Count tables
    const tables = await DatabaseClient.query(
      'count_tables',
      `SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'`,
      [],
      null
    );
    console.log(`📊 Total tables: ${tables?.table_count || 0}`);
    
    // Test 2: List all tables
    const tableList = await DatabaseClient.query(
      'list_tables',
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
      [],
      []
    );
    
    console.log('\n📋 Your Inner Circle database structure:');
    if (Array.isArray(tableList)) {
      tableList.forEach((table: any) => {
        console.log(`  • ${table.table_name}`);
      });
    }
    
    // Test 3: Try inserting a test member
    const testMember = await DatabaseClient.query(
      'test_insert',
      `INSERT INTO inner_circle_members (email_hash, email_hash_prefix, name, tier) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, created_at`,
      [
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'e3b0c44298fc',
        'Test User',
        'basic'
      ],
      null
    );
    
    if (testMember) {
      console.log(`\n👤 Test member created: ID ${testMember.id}`);
    }
    
    // Test 4: Count members
    const memberCount = await DatabaseClient.query(
      'count_members',
      'SELECT COUNT(*) as count FROM inner_circle_members',
      [],
      null
    );
    console.log(`👥 Total members: ${memberCount?.count || 0}`);
    
    // Test 5: Try a complex query from inner-circle-queries.ts
    const stats = await DatabaseClient.query(
      'table_stats',
      `SELECT 
        (SELECT COUNT(*) FROM inner_circle_members) as members,
        (SELECT COUNT(*) FROM inner_circle_keys) as keys,
        (SELECT COUNT(*) FROM key_unlock_logs) as unlock_logs,
        (SELECT COUNT(*) FROM member_flags) as flags,
        (SELECT COUNT(*) FROM key_audit_logs) as audit_logs`,
      [],
      null
    );
    
    console.log('\n📈 Database Statistics:');
    if (stats) {
      console.log(`  Members: ${stats.members}`);
      console.log(`  Keys: ${stats.keys}`);
      console.log(`  Unlock Logs: ${stats.unlock_logs}`);
      console.log(`  Flags: ${stats.flags}`);
      console.log(`  Audit Logs: ${stats.audit_logs}`);
    }
    
    await DatabaseClient.close();
    console.log('\n🎉 SUCCESS! Your Inner Circle database is fully operational.');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    // Check for common issues
    if (error.message.includes('SSL')) {
      console.log('\n💡 SSL issue - check your .env.local file has correct DATABASE_URL');
      console.log('Current DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    }
  }
}

testFullDatabase().catch(console.error);