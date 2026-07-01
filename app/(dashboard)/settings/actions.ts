"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured, PLAN } from "@/lib/stripe";

export type SettingsResult = { error?: string; message?: string };

async function getUser() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Update the agent's profile (name, agency, phone, timezone). */
export async function updateProfile(
  _prev: SettingsResult | undefined,
  formData: FormData
): Promise<SettingsResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Not authenticated." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) return { error: "Name is required." };
  const agency_name = String(formData.get("agency_name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, agency_name, phone, timezone })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}

/**
 * Start a Stripe Checkout session for the $49/mo plan and redirect to it.
 * In simulate mode (no Stripe keys) this returns an error prompting the user
 * to use the simulate button instead.
 */
export async function startCheckout(): Promise<SettingsResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Not authenticated." };

  if (!isStripeConfigured() || !process.env.STRIPE_PRICE_ID) {
    return {
      error:
        "Stripe isn't configured yet. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID to enable real checkout.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe = getStripe();

  // Ensure we have a customer to attach the subscription to.
  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_id: user.id },
    });
    customerId = customer.id;
    await createAdminClient()
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl()}/settings/billing?checkout=success`,
    cancel_url: `${appUrl()}/settings/billing?checkout=cancelled`,
    metadata: { supabase_id: user.id },
  });

  if (!session.url) return { error: "Could not start checkout." };
  redirect(session.url);
}

/** Open the Stripe billing portal so the customer can manage/cancel. */
export async function openBillingPortal(): Promise<SettingsResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Not authenticated." };

  if (!isStripeConfigured()) {
    return { error: "Stripe isn't configured yet." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_customer_id) {
    return { error: "No billing account found." };
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl()}/settings/billing`,
  });
  redirect(session.url);
}

/**
 * SIMULATE-ONLY: flip the subscription locally so the paywall can be tested
 * without a live Stripe account. No-ops (returns an error) once real keys are
 * set — real status then flows only from Stripe webhooks. `PLAN` is referenced
 * to keep the plan price in one place.
 */
export async function simulateSetStatus(
  status: "active" | "canceled" | "trialing"
): Promise<SettingsResult> {
  const { user } = await getUser();
  if (!user) return { error: "Not authenticated." };
  if (isStripeConfigured()) {
    return { error: "Stripe is configured — use real checkout/portal." };
  }

  const update: {
    subscription_status: "active" | "canceled" | "trialing";
    trial_ends_at?: string;
  } = { subscription_status: status };
  // Re-starting a simulated trial gives a fresh 14 days.
  if (status === "trialing") {
    update.trial_ends_at = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings/billing");
  revalidatePath("/", "layout");
  return {
    message:
      status === "active"
        ? `Simulated ${PLAN.name} activation ($${PLAN.priceMonthly}/mo).`
        : `Simulated status: ${status}.`,
  };
}