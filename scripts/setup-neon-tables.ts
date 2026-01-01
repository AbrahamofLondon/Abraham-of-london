// scripts/setup-neon-tables.ts
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupNeonTables() {
  console.log('📦 Setting up Inner Circle tables on Neon...');
  
  // Your Neon connection string
  const connectionString = 'postgresql://neondb_owner:npg_lVTc95DapNuM@ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech/abraham_of_london?sslmode=require';
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon database');
    
    // Read your schema file
    const schemaPath = join(process.cwd(), 'lib/server/inner-circle-schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');
    
    console.log(\📄 Schema file loaded (\ characters)\);
    
    // Remove DROP TABLE statements (they cause errors if tables don't exist yet)
    const safeSQL = schemaSQL.replace(/DROP TABLE IF EXISTS .* CASCADE;/g, '-- DROP TABLE statement removed');
    
    // Split into statements
    const statements = safeSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(\Found \ SQL statements to execute\);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      console.log(\Executing (\/\)...\);
      
      try {
        await client.query(statement);
        console.log(\  ✅ Statement \ executed\);
      } catch (error: any) {
        console.log(\  ⚠️  Statement \ failed: \, error.message.split('\n')[0]);
        // Continue with next statement
      }
    }
    
    // Verify tables were created
    const tables = await client.query(\
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    \);
    
    console.log('\n📋 Final table list:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(\  • \\);
      });
    } else {
      console.log('  No tables found - something went wrong');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Schema setup complete!');
    
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupNeonTables().catch(console.error);
