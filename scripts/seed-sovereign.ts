import { prisma } from "../lib/prisma";
import crypto from "crypto";

async function seed() {
  const pepper = process.env.ACCESS_KEY_PEPPER;
  if (!pepper) throw new Error("No Pepper Found");

  // 1. Create your Primary Identity
  const sovereign = await prisma.innerCircleMember.upsert({
    where: { email: "admin@abraham-of-london.org" }, // Replace with your actual email
    update: {},
    create: {
      email: "admin@abraham-of-london.org",
      name: "Abraham of London",
      role: "OWNER", // Grants absolute system authority
      tier: "private" // Highest access level
    }
  });

  console.log("Sovereign Identity Restored:", sovereign.email);
}

seed().catch(console.error);