import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupNeonTables() {
  console.log('📦 Setting up Inner Circle tables on Neon...');
  
  // connectionString should ideally be in process.env.DATABASE_URL
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
    
    if (!fsSync.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSQL = readFileSync(schemaPath, 'utf8');
    console.log(`📄 Schema file loaded (${schemaSQL.length} characters)`);
    
    // Split into statements, handling comments and empty lines
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute statements
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const step = i + 1;
      
      console.log(`Executing (${step}/${statements.length})...`);
      
      try {
        await client.query(statement);
        console.log(`   ✅ Statement ${step} executed`);
      } catch (error: any) {
        // We log the error but continue (common for "IF NOT EXISTS" logic)
        console.warn(`   ⚠️  Statement ${step} warning: ${error.message.split('\n')[0]}`);
      }
    }
    
    // Verify results
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Final table list:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`   • ${row.table_name}`);
      });
    } else {
      console.log('   No tables found in public schema.');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Neon Schema setup complete!');
    
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupNeonTables().catch(console.error);