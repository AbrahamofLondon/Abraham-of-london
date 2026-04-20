/**
 * lib/hubspot/activities.ts — Activity/engagement logging via HubSpot v3 API
 *
 * Logs activities on the contact timeline (notes).
 * Uses the notes API for simplicity and broad compatibility.
 */

import { hubspotFetch } from "./client";

type NoteInput = {
  contactId: string;
  body: string;
  timestamp?: string;
};

/**
 * Create a note on a contact's timeline.
 */
export async function logActivity(input: NoteInput): Promise<boolean> {
  const hs_timestamp = input.timestamp || new Date().toISOString();
  const hs_note_body = input.body;

  const result = await hubspotFetch<{ id: string }>("/crm/v3/objects/notes", {
    method: "POST",
    body: {
      properties: { hs_timestamp, hs_note_body },
    },
  });

  if (!result.ok) return false;

  // Associate note with contact
  await hubspotFetch(
    `/crm/v3/objects/notes/${result.data.id}/associations/contacts/${input.contactId}/note_to_contact`,
    { method: "PUT" },
  );

  return true;
}
