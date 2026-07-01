"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seedDefaultSequences } from "@/lib/seed-default-sequences";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export type AuthState = { error?: string; message?: string } | undefined;

const TRIAL_DAYS = 14;

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Your name is required."),
  agencyName: z.string().trim().optional(),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const magicLinkSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    agencyName: formData.get("agencyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullName, agencyName, email, password } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, agency_name: agencyName ?? null },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Signup failed - please try again." };
  }

  // Create the profile row + seed default sequences with the service-role
  // client so it works whether or not an email-confirmed session exists yet.
  const admin = createAdminClient();
  const trialEndsAt = new Date(
    Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    agency_name: agencyName ?? null,
    subscription_status: "trialing",
    trial_ends_at: trialEndsAt,
  });
  if (profileError) {
    return { error: profileError.message };
  }

  // Create a Stripe customer up front so /settings/billing can start a
  // checkout later. Non-fatal + skipped in simulate mode (no keys) — the DB
  // trial (subscription_status/trial_ends_at above) is what gates access.
  if (isStripeConfigured()) {
    try {
      const customer = await getStripe().customers.create({
        email,
        name: fullName,
        metadata: { supabase_id: userId },
      });
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", userId);
    } catch (e) {
      console.error("Failed to create Stripe customer:", e);
    }
  }

  // Guard against double-seeding on signup retries.
  const { count } = await admin
    .from("sequences")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", userId);
  if (!count) {
    try {
      await seedDefaultSequences(admin, userId);
    } catch (e) {
      // Non-fatal: the account exists; sequences can be re-seeded later.
      console.error("Failed to seed default sequences:", e);
    }
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  // Email confirmation is on: no session yet.
  redirect(
    "/login?message=" +
      encodeURIComponent("Check your email to confirm your account.")
  );
}

export async function requestMagicLink(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
  if (error) {
    return { error: error.message };
  }

  return { message: "Check your email for a magic sign-in link." };
}

