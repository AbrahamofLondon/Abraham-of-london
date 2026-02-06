import { prisma } from "../lib/prisma";

async function generateMasterKey() {
  console.log("🗝️ [MASTER_KEY_GEN]: Establishing Directorate Access...");

  const adminEmails = [
    "info@abrahamoflondon.org",
    "seunadaramola@gmail.com",
    "abrahamadaramola@outlook.com"
  ];

  try {
    const adminProfiles = [];

    for (const email of adminEmails) {
      // 1. Check for existing member
      let member = await prisma.innerCircleMember.findFirst({
        where: { email: email }
      });

      if (!member) {
        console.log(`👤 Creating Owner profile for: ${email}`);
        
        // Use a simple prefix of the email as the emailHashPrefix to satisfy the schema
        const prefix = email.split('@')[0].substring(0, 4);

        member = await prisma.innerCircleMember.create({
          data: {
            email,
            name: email === "info@abrahamoflondon.org" ? "AOL Official" : "Abraham Adaramola",
            role: "owner", // UPDATED: Role is now owner
            tier: "Director",
            status: "active",
            emailHash: email, // Placeholder for hash logic
            emailHashPrefix: prefix // RESOLVES: Missing argument error
          }
        });
      } else {
        console.log(`✅ Verified existing profile: ${email}`);
        member = await prisma.innerCircleMember.update({
          where: { id: member.id },
          data: { role: "owner", tier: "Director", status: "active" }
        });
      }
      adminProfiles.push(member);
    }

    // 2. Generate the Master Key
    const rawKey = `AOL-MASTER-VAULT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 3. Link the key to the primary Directorate account
    await prisma.innerCircleKey.create({
      data: {
        memberId: adminProfiles[0].id,
        keyHash: rawKey, 
        keySuffix: rawKey.slice(-4),
        status: "active",
        keyType: "master",
        metadata: JSON.stringify({ 
          ownerAccess: true,
          backups: [adminEmails[1], adminEmails[2]]
        })
      }
    });

    console.log("\n--- 🛡️ INSTITUTIONAL OWNER ACCESS ---");
    console.log(`👤 OWNER: ${adminEmails[0]}`);
    console.log(`👤 ADMINS: ${adminEmails[1]}, ${adminEmails[2]}`);
    console.log(`🔑 MASTER KEY: ${rawKey}`);
    console.log("---------------------------------------\n");
    console.log("🚀 Success: You now have the Master Key and Owner status.");

  } catch (error) {
    console.error("❌ [GEN_FAILURE]:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMasterKey();