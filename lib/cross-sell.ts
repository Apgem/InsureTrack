import type { PolicyType } from "@/types/database";

// The personal-lines bundle we nudge agents to complete. Phase 3 expands the
// cross-sell detection; this is the baseline rule used on the client detail page.
const BUNDLE: PolicyType[] = ["auto", "home", "life"];

/**
 * Given the policy types a client actively holds, return the bundle policies
 * they're missing — but only if they already hold at least one bundle policy
 * (no point nudging a brand-new contact with nothing).
 */
export function getCrossSellSuggestions(active: PolicyType[]): PolicyType[] {
  const has = new Set(active);
  if (!BUNDLE.some((t) => has.has(t))) return [];
  return BUNDLE.filter((t) => !has.has(t));
}
