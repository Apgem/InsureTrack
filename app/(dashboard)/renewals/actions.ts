"use server";

import { revalidatePath } from "next/cache";

import type { PolicyType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export type RenewalActionResult = { error?: string; message?: string };

/**
 * Mark a policy renewed or lapsed from the renewals board.
 */
export async function setPolicyStatus(
  policyId: string,
  status: "renewed" | "lapsed"
): Promise<RenewalActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("policies")
    .update({ status })
    .eq("id", policyId);

  if (error) return { error: error.message };
  revalidatePath("/renewals");
  revalidatePath("/dashboard");
  return {};
}

/**
 * Fire a one-off renewal reminder. Phase 3 records the reminder to
 * messages_log (so it shows in the client's message history); actual
 * email/SMS delivery via Resend/Twilio is wired in Phase 4.
 */
export async function sendRenewalReminder(
  policyId: string
): Promise<RenewalActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: policy, error: pErr } = await supabase
    .from("policies")
    .select("id, client_id, policy_type, renewal_date")
    .eq("id", policyId)
    .maybeSingle();
  if (pErr || !policy) return { error: "Policy not found." };

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, sms_opted_out")
    .eq("id", policy.client_id)
    .maybeSingle();
  if (!client) return { error: "Client not found." };

  // Choose channel: prefer email, fall back to SMS (respecting opt-out).
  let channel: "email" | "sms";
  if (client.email) {
    channel = "email";
  } else if (client.phone && !client.sms_opted_out) {
    channel = "sms";
  } else if (client.phone && client.sms_opted_out) {
    return { error: "Client has opted out of SMS and has no email on file." };
  } else {
    return { error: "Client has no email or phone on file." };
  }

  const firstName = client.full_name.trim().split(/\s+/)[0];
  const typeLabel = POLICY_TYPE_LABELS[policy.policy_type as PolicyType];
  const subject =
    channel === "email" ? `Your ${typeLabel} policy renews soon` : null;
  const body =
    `Hi ${firstName}, your ${typeLabel} policy renews on ` +
    `${formatDate(policy.renewal_date)}. Let's review your coverage before then.`;

  const { error: logErr } = await supabase.from("messages_log").insert({
    agent_id: user.id,
    client_id: client.id,
    channel,
    subject,
    body,
    status: "sent",
  });
  if (logErr) return { error: logErr.message };

  revalidatePath("/renewals");
  revalidatePath(`/clients/${client.id}`);
  return {
    message: `Reminder logged (${channel}). Delivery activates in Phase 4.`,
  };
}
