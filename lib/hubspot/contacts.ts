/**
 * lib/hubspot/contacts.ts — Contact create/update via HubSpot v3 API
 *
 * Uses the "create or update" pattern: search by email first,
 * then create or patch. HubSpot deduplicates on email.
 */

import { hubspotFetch } from "./client";

export type ContactProperties = {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  jobtitle?: string;
  aol_route?: string;
  aol_diagnostic_score?: number;
  aol_severity?: string;
  aol_tier?: string;
  aol_trajectory?: string;
  aol_has_paid?: boolean;
  aol_last_diagnostic?: string;
  aol_organisation?: string;
  lifecyclestage?: string;
};

type HubSpotContact = {
  id: string;
  properties: Record<string, string | null>;
};

/**
 * Search for an existing contact by email.
 */
async function findContactByEmail(email: string): Promise<string | null> {
  const result = await hubspotFetch<{ total: number; results: HubSpotContact[] }>(
    "/crm/v3/objects/contacts/search",
    {
      method: "POST",
      body: {
        filterGroups: [
          {
            filters: [
              { propertyName: "email", operator: "EQ", value: email.toLowerCase() },
            ],
          },
        ],
        limit: 1,
      },
    },
  );

  if (!result.ok) return null;
  return result.data.results[0]?.id ?? null;
}

/**
 * Splits a full name into first/last. Simple split on first space.
 */
function splitName(fullName?: string): { firstname?: string; lastname?: string } {
  if (!fullName?.trim()) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0] };
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

/**
 * Build clean properties object — only include defined, non-empty values.
 */
function cleanProperties(props: ContactProperties): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === "") continue;
    clean[key] = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
  }
  return clean;
}

/**
 * Create or update a HubSpot contact.
 * Returns the contact ID or null on failure.
 */
export async function upsertContact(
  props: ContactProperties & { fullName?: string },
): Promise<string | null> {
  const email = props.email?.toLowerCase().trim();
  if (!email) return null;

  const { fullName, ...rest } = props;
  const nameFields = splitName(fullName);
  const properties = cleanProperties({
    ...rest,
    ...nameFields,
    email,
  });

  // Try to find existing contact
  const existingId = await findContactByEmail(email);

  if (existingId) {
    // Update existing contact — don't overwrite with empty values
    const result = await hubspotFetch(`/crm/v3/objects/contacts/${existingId}`, {
      method: "PATCH",
      body: { properties },
    });
    return result.ok ? existingId : null;
  }

  // Create new contact
  const result = await hubspotFetch<HubSpotContact>("/crm/v3/objects/contacts", {
    method: "POST",
    body: { properties },
  });

  return result.ok ? result.data.id : null;
}
