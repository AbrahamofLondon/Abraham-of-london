#!/usr/bin/env node
/**
 * scripts/recover-intakes.mjs - NEON/POSTGRES VERSION
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load variables from .env.local
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '../tmp/intakes.log');

// Uses the DATABASE_URL you copied from the Neon Dashboard
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runRecovery() {
  console.log("🛠️ [RECOVERY]: Initializing Neon/Postgres sync...");

  if (!fs.existsSync(LOG_FILE)) {
    console.log("✅ [CLEAN]: No local fallback logs found.");
    return;
  }

  await client.connect();

  const rawContent = fs.readFileSync(LOG_FILE, 'utf-8');
  const lines = rawContent.split('\n').filter(line => line.includes('[INTAKE_BACKUP]'));

  console.log(`🔍 [AUDIT]: Found ${lines.length} backup entries.`);

  let recoveredCount = 0;

  for (const line of lines) {
    try {
      const jsonStr = line.substring(line.indexOf('{'));
      const entry = JSON.parse(jsonStr);

      // Neon-compatible Insert Query
      const query = `
        INSERT INTO strategy_room_intakes 
        (full_name, email_hash, organisation, status, score, decision_statement, payload, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING;
      `;

      const values = [
        entry.full_name,
        entry.email_hash || 'legacy',
        entry.organisation,
        entry.status,
        entry.score,
        entry.decision_statement,
        JSON.stringify(entry.payload),
        entry.created_at
      ];

      await client.query(query, values);
      recoveredCount++;
      console.log(`++ [SYNCED]: ${entry.full_name}`);
    } catch (err) {
      console.error("❌ [ERROR]: Line skipped:", err.message);
    }
  }

  await client.end();
  console.log(`\n✨ [COMPLETE]: ${recoveredCount} records processed.`);
}

runRecovery().catch(console.error);