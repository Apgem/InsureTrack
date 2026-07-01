import type { SubscriptionStatus } from "@/types/database";

export type Entitlement = {
  status: SubscriptionStatus | null;
  /** Allowed into the app (active subscription OR unexpired trial). */
  entitled: boolean;
  /** On a trial (regardless of whether it's still valid). */
  trialing: boolean;
  /** Whole days left on the trial, or null if no trial date. */
  trialDaysLeft: number | null;
  /** Trial has run out and there's no active subscription. */
  expired: boolean;
};

/**
 * Single source of truth for "can this account use the app?" Shared by the
 * paywall middleware, the billing page, and the dashboard so the rules never
 * drift apart.
 */
export function getEntitlement(profile: {
  subscription_status: SubscriptionStatus | null;
  trial_ends_at: string | null;
}): Entitlement {
  const status = profile.subscription_status ?? null;

  let trialDaysLeft: number | null = null;
  let trialValid = false;
  if (profile.trial_ends_at) {
    const ms = new Date(profile.trial_ends_at).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    trialValid = ms > 0;
  }

  const trialing = status === "trialing";
  const entitled = status === "active" || (trialing && trialValid);
  const expired = trialing ? !trialValid : status !== "active";

  return { status, entitled, trialing, trialDaysLeft, expired };
}