import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. BYPASSES Row-Level Security — server-only.
 * Never import this into a Client Component or expose the key to the browser.
 *
 * Used for trusted server work that must run regardless of the user's session,
 * e.g. creating the profile row + seeding default sequences right after signup
 * (which may happen before an email-confirmed session exists).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        // Bypass Next.js's fetch cache — without this, the cron/webhook read
        // stale snapshots of the DB across invocations (cached supabase-js
        // GET requests), causing it to miss new rows and reference deleted ones.
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}
