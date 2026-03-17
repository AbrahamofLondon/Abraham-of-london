// scripts/migrate-tiers.ts
import * as dotenv from "dotenv";
import path from "path";

// 1. Load environment variables from .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { connectToDatabase } from "../lib/database/connection";
import User from "../lib/database/models/User";
import { normalizeUserTier } from "../lib/access/tier-policy";

async function migrateUserTiers() {
  // Guard check for the URI after attempting to load dotenv
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is still missing after loading .env.local.");
    console.error("Ensure MONGODB_URI is defined in your .env.local file.");
    process.exit(1);
  }

  try {
    console.log("Connecting to Vault DB...");
    await connectToDatabase();
    
    console.log("Connection established. Fetching users...");
    const users = await User.find({});
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const currentTier = user.tier || "member";
      const normalized = normalizeUserTier(currentTier);

      // Only update if there is a discrepancy or missing normalization field
      if (user.tier !== normalized || !user.normalizedTier) {
        user.tier = normalized;
        user.normalizedTier = normalized;
        
        // Update metadata for audit trail
        user.metadata = {
          ...(user.metadata || {}),
          migration_2026_original: currentTier,
          migration_date: new Date().toISOString(),
          migration_tag: "SSOT_TIER_2026"
        };

        await user.save();
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log("--------------------------------------------------");
    console.log(`✅ Migration Complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Already Normalized: ${skippedCount}`);
    console.log("--------------------------------------------------");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed during execution:");
    console.error(err);
    process.exit(1);
  }
}

// Execute migration
migrateUserTiers();