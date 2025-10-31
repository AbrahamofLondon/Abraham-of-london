// lib/subscribe.ts

// Assuming isEmail utility is available from stringUtils or similar
// import { isEmail } from "./stringUtils"; 

// --- Type Definitions ---

interface SubscribeRequest {
  email: string;
}

interface SubscribeResponse {
  ok: boolean;
  message: string;
}

// --- Main Function ---

/**
 * Utility function to check for a basic email pattern.
 * NOTE: This local definition is used if the external utility is not available.
 */
function isEmail(s: string): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/**
 * Submits an email to the newsletter API endpoint for subscription.
 *
 * @param email The email address to subscribe.
 * @returns A promise resolving to an object with the subscription status and a message.
 */
export async function subscribe(email: string): Promise<SubscribeResponse> {
  const safeEmail = email.trim();

  // 1. Client-side input validation
  if (!isEmail(safeEmail)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  
  const endpoint = "/api/newsletter";

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      body: JSON.stringify({ email: safeEmail } as SubscribeRequest),
      // Optional: Add signal for timeout/abort control
      // signal: AbortSignal.timeout(5000), 
    });

    // 2. Attempt to parse JSON response regardless of status
    let data: Partial<SubscribeResponse> = {};
    try {
      data = (await r.json()) as Partial<SubscribeResponse>;
    } catch (e) {
      // If JSON parsing fails (e.g., server returned plain text or empty body)
      const text = await r.text().catch(() => ''); 
      data.message = text || `Server returned an unreadable response (Status ${r.status}).`;
    }

    // 3. Handle successful response (HTTP 200-299 AND API status 'ok')
    if (r.ok && data?.ok) {
      return { 
        ok: true, 
        // FIX: Corrected the broken apostrophe escape sequence
        message: String(data.message || "You're subscribed. Welcome! 🎉") 
      };
    }

    // 4. Handle failed response (HTTP non-200 or API status 'not ok')
    // Prioritize the message from the server response data
    return {
      ok: false,
      message: String(
        data?.message ||
        `Subscription failed (HTTP ${r.status}). Please try again later.`
      ),
    };

  } catch (error) {
    // 5. Handle network or fetch-specific errors
    console.error(`Subscription API fetch failed at ${endpoint}:`, error);
    return {
      ok: false,
      message: `A network error occurred. Check your connection or try again.`,
    };
  }
}