import Stripe from "stripe";

/**
 * Server-only Stripe client. Like the Resend/Twilio libs, this runs in
 * "simulate" mode until real keys are set — isStripeConfigured() is false when
 * STRIPE_SECRET_KEY is empty or a placeholder, so billing UI and the paywall
 * can be exercised end-to-end without a live Stripe account.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;

export function isStripeConfigured(): boolean {
  return Boolean(secretKey && !secretKey.startsWith("your-"));
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  }
  if (!_stripe) {
    // Pin to the SDK's bundled apiVersion by omitting the override.
    _stripe = new Stripe(secretKey!);
  }
  return _stripe;
}

/** The single subscription plan (spec: $49/mo after a 14-day trial). */
export const PLAN = {
  name: "InsureTrack Pro",
  priceMonthly: 49,
  currency: "USD",
} as const;