/**
 * scripts/hubspot-setup.ts — One-time HubSpot portal configuration
 *
 * Creates custom contact properties for the Abraham of London integration.
 * Idempotent — safe to re-run. Skips properties that already exist.
 *
 * Usage: npx tsx scripts/hubspot-setup.ts
 */

const HUBSPOT_BASE = "https://api.hubapi.com";
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || process.env.CRM_API_KEY || "";

if (!TOKEN) {
  console.error("Missing HUBSPOT_ACCESS_TOKEN or CRM_API_KEY");
  process.exit(1);
}

type PropertyDef = {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  groupName: string;
  description: string;
  options?: Array<{ label: string; value: string }>;
};

const AOL_PROPERTIES: PropertyDef[] = [
  {
    name: "aol_route",
    label: "AOL Route",
    type: "enumeration",
    fieldType: "select",
    groupName: "contactinformation",
    description: "Constitutional routing decision (STRATEGY/DIAGNOSTIC/REJECT)",
    options: [
      { label: "Strategy", value: "STRATEGY" },
      { label: "Diagnostic", value: "DIAGNOSTIC" },
      { label: "Reject", value: "REJECT" },
    ],
  },
  {
    name: "aol_diagnostic_score",
    label: "AOL Diagnostic Score",
    type: "number",
    fieldType: "number",
    groupName: "contactinformation",
    description: "Latest diagnostic score (0-100)",
  },
  {
    name: "aol_severity",
    label: "AOL Severity",
    type: "enumeration",
    fieldType: "select",
    groupName: "contactinformation",
    description: "Latest diagnostic severity classification",
    options: [
      { label: "Low", value: "LOW" },
      { label: "Medium", value: "MEDIUM" },
      { label: "High", value: "HIGH" },
      { label: "Critical", value: "CRITICAL" },
    ],
  },
  {
    name: "aol_tier",
    label: "AOL Access Tier",
    type: "enumeration",
    fieldType: "select",
    groupName: "contactinformation",
    description: "Current access tier in the platform",
    options: [
      { label: "Public", value: "public" },
      { label: "Member", value: "member" },
      { label: "Inner Circle", value: "inner-circle" },
      { label: "Client", value: "client" },
      { label: "Architect", value: "architect" },
      { label: "Owner", value: "owner" },
    ],
  },
  {
    name: "aol_trajectory",
    label: "AOL Trajectory",
    type: "enumeration",
    fieldType: "select",
    groupName: "contactinformation",
    description: "Prognostic trajectory classification",
    options: [
      { label: "Ascending", value: "ASCENDING" },
      { label: "Stagnant", value: "STAGNANT" },
      { label: "Fragile", value: "FRAGILE" },
      { label: "Deteriorating", value: "DETERIORATING" },
    ],
  },
  {
    name: "aol_has_paid",
    label: "AOL Has Paid",
    type: "enumeration",
    fieldType: "booleancheckbox",
    groupName: "contactinformation",
    description: "Whether this contact has made a paid purchase",
    options: [
      { label: "Yes", value: "true" },
      { label: "No", value: "false" },
    ],
  },
  {
    name: "aol_last_diagnostic",
    label: "AOL Last Diagnostic",
    type: "date",
    fieldType: "date",
    groupName: "contactinformation",
    description: "Date of last diagnostic completion",
  },
  {
    name: "aol_organisation",
    label: "AOL Organisation",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
    description: "Organisation name from intake forms",
  },
];

async function createProperty(prop: PropertyDef): Promise<void> {
  const res = await fetch(`${HUBSPOT_BASE}/crm/v3/properties/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prop),
  });

  if (res.ok) {
    console.log(`  + Created: ${prop.name}`);
  } else if (res.status === 409) {
    console.log(`  = Exists:  ${prop.name}`);
  } else {
    const text = await res.text().catch(() => "");
    console.error(`  ! Failed:  ${prop.name} (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function main() {
  console.log("HubSpot Setup — Abraham of London");
  console.log(`Portal: ${process.env.HUBSPOT_PORTAL_ID || "unknown"}`);
  console.log(`Token:  ${TOKEN.slice(0, 10)}...`);
  console.log("");

  console.log("Creating custom contact properties...");
  for (const prop of AOL_PROPERTIES) {
    await createProperty(prop);
  }

  console.log("");
  console.log("Done. Properties are ready.");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
