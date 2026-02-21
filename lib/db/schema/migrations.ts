#!/usr/bin/env node
// scripts/run-migrations.ts
import { migrations } from '../lib/db/schema/migrations';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'up':
      console.log('Running migrations...');
      const executed = await migrations.up();
      console.log(`Executed ${executed.length} migrations`);
      break;

    case 'status':
      const status = migrations.status();
      console.log('\nMigration Status:');
      console.log(`Total: ${status.total}`);
      console.log(`Executed: ${status.executed}`);
      console.log(`Pending: ${status.pending}`);
      console.log('\nMigrations:');
      status.migrations.forEach(m => {
        console.log(`  ${m.executed ? '✅' : '⏳'} ${m.name} ${m.executedAt ? `(${m.executedAt.toISOString()})` : ''}`);
      });
      break;

    case 'reset':
      if (process.env.NODE_ENV === 'production') {
        console.error('Cannot reset in production!');
        process.exit(1);
      }
      console.log('Resetting database...');
      await migrations.reset();
      console.log('Database reset complete');
      break;

    default:
      console.log('Usage:');
      console.log('  run-migrations up     - Run pending migrations');
      console.log('  run-migrations status - Show migration status');
      console.log('  run-migrations reset  - Reset database (dev only)');
      process.exit(1);
  }

  migrations.close();
}

main().catch(console.error);