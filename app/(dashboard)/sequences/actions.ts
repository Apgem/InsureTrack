"use server";

import { revalidatePath } from "next/cache";

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  sequenceSchema,
  stepSchema,
  type SequenceInput,
  type StepInput,
} from "@/lib/validations";
import { renderTemplate, sendMessage } from "@/lib/messaging";
import { formatDate } from "@/lib/format";

export type SeqActionResult = { error?: string; id?: string; message?: string };

async function getAgent() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Sequences
// ---------------------------------------------------------------------------

export async function createSequence(
  input: SequenceInput
): Promise<SeqActionResult> {
  const parsed = sequenceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("sequences")
    .insert({
      agent_id: user.id,
      name: parsed.data.name,
      trigger_type: parsed.data.trigger_type,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/sequences");
  return { id: data.id };
}

export async function updateSequence(
  id: string,
  input: SequenceInput
): Promise<SeqActionResult> {
  const parsed = sequenceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("sequences")
    .update({ name: parsed.data.name, trigger_type: parsed.data.trigger_type })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sequences");
  revalidatePath(`/sequences/${id}`);
  return { id };
}

export async function toggleSequence(
  id: string,
  isActive: boolean
): Promise<SeqActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("sequences")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sequences");
  revalidatePath(`/sequences/${id}`);
  return { id };
}

export async function deleteSequence(id: string): Promise<SeqActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("sequences").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sequences");
  return {};
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export async function addStep(
  sequenceId: string,
  input: StepInput
): Promise<SeqActionResult> {
  const parsed = stepSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  // Next step_order = current max + 1.
  const { data: existing } = await supabase
    .from("sequence_steps")
    .select("step_order")
    .eq("sequence_id", sequenceId)
    .order("step_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.step_order ?? 0) + 1;

  const { error } = await supabase.from("sequence_steps").insert({
    sequence_id: sequenceId,
    step_order: nextOrder,
    channel: parsed.data.channel,
    delay_days: parsed.data.delay_days,
    subject: parsed.data.subject ?? null,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };
  revalidatePath(`/sequences/${sequenceId}`);
  return {};
}

export async function updateStep(
  id: string,
  sequenceId: string,
  input: StepInput
): Promise<SeqActionResult> {
  const parsed = stepSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("sequence_steps")
    .update({
      channel: parsed.data.channel,
      delay_days: parsed.data.delay_days,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/sequences/${sequenceId}`);
  return {};
}

export async function deleteStep(
  id: string,
  sequenceId: string
): Promise<SeqActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("sequence_steps").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/sequences/${sequenceId}`);
  return {};
}

/**
 * Swap a step with its neighbour. Uses a temporary step_order (-1) between the
 * two updates so the unique(sequence_id, step_order) constraint never trips.
 */
export async function moveStep(
  id: string,
  sequenceId: string,
  direction: "up" | "down"
): Promise<SeqActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { data: steps } = await supabase
    .from("sequence_steps")
    .select("id, step_order")
    .eq("sequence_id", sequenceId)
    .order("step_order", { ascending: true });
  if (!steps) return { error: "Could not load steps." };

  const idx = steps.findIndex((s) => s.id === id);
  if (idx === -1) return { error: "Step not found." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= steps.length) return {}; // nothing to do

  const a = steps[idx];
  const b = steps[swapIdx];

  await supabase.from("sequence_steps").update({ step_order: -1 }).eq("id", a.id);
  await supabase
    .from("sequence_steps")
    .update({ step_order: a.step_order })
    .eq("id", b.id);
  await supabase
    .from("sequence_steps")
    .update({ step_order: b.step_order })
    .eq("id", a.id);

  revalidatePath(`/sequences/${sequenceId}`);
  return {};
}

// ---------------------------------------------------------------------------
// Manual enrollment
// ---------------------------------------------------------------------------

export type EnrollTarget = { clientId?: string; leadId?: string };
export type EnrollResult = {
  error?: string;
  enrolled?: number;
  skipped?: number;
  failed?: number;
};

/**
 * Manually enroll one or more clients/leads into a sequence. The daily cron
 * then processes the enrollment like any auto-enrolled one. Already-active
 * enrollments are skipped (the partial unique index is the backstop).
 *
 * A single bad target (e.g. a client deleted in another tab while this
 * dialog was open) must not discard progress already made on the others —
 * every target is attempted, and failures are counted rather than aborting
 * the batch.
 */
export async function enrollInSequence(
  sequenceId: string,
  targets: EnrollTarget[]
): Promise<EnrollResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };
  if (!targets.length) return { error: "No one selected." };

  // Verify the sequence belongs to this agent.
  const { data: seq } = await supabase
    .from("sequences")
    .select("id")
    .eq("id", sequenceId)
    .eq("agent_id", user.id)
    .maybeSingle();
  if (!seq) return { error: "Sequence not found." };

  let enrolled = 0;
  let skipped = 0;
  let failed = 0;
  for (const t of targets) {
    if (!t.clientId && !t.leadId) continue;
    const col = t.clientId ? "client_id" : "lead_id";
    const val = (t.clientId ?? t.leadId) as string;

    // Skip if already actively enrolled.
    const { data: existing } = await supabase
      .from("sequence_enrollments")
      .select("id")
      .eq("sequence_id", sequenceId)
      .eq(col, val)
      .eq("status", "active")
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("sequence_enrollments").insert({
      sequence_id: sequenceId,
      client_id: t.clientId ?? null,
      lead_id: t.leadId ?? null,
      current_step: 0,
      status: "active",
    });
    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) skipped++;
      else failed++;
      continue;
    }
    enrolled++;
    if (t.clientId) revalidatePath(`/clients/${t.clientId}`);
    if (t.leadId) revalidatePath(`/leads/${t.leadId}`);
  }

  revalidatePath("/sequences");
  revalidatePath(`/sequences/${sequenceId}`);

  if (enrolled === 0 && skipped === 0 && failed > 0) {
    return {
      error:
        failed === 1
          ? "Couldn't enroll — that contact may have been deleted. Refresh and try again."
          : `Couldn't enroll any of the ${failed} selected — they may have been deleted. Refresh and try again.`,
      failed,
    };
  }

  return { enrolled, skipped, failed };
}

/** Cancel an enrollment (stops future sends; keeps message history). */
export async function unenroll(enrollmentId: string): Promise<SeqActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("sequence_enrollments")
    .update({ status: "cancelled" })
    .eq("id", enrollmentId);
  if (error) return { error: error.message };

  revalidatePath("/sequences");
  return {};
}

/**
 * Send a test of one step to the agent themselves, with sample variables.
 * Not recorded to messages_log (it's a preview, not a real client send).
 */
export async function testSendStep(stepId: string): Promise<SeqActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { data: step } = await supabase
    .from("sequence_steps")
    .select("channel, subject, body")
    .eq("id", stepId)
    .maybeSingle();
  if (!step) return { error: "Step not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  const sampleVars = {
    first_name: "Sample",
    renewal_date: formatDate(
      new Date(Date.now() + 30 * 86400000).toISOString()
    ),
    policy_type: "Auto",
  };
  const body = renderTemplate(step.body, sampleVars);
  const subject = step.subject ? renderTemplate(step.subject, sampleVars) : null;

  if (step.channel === "email") {
    if (!user.email) return { error: "Your account has no email to test with." };
    const res = await sendMessage({
      channel: "email",
      to: user.email,
      subject,
      body,
    });
    if (!res.ok) return { error: res.error ?? "Send failed." };
    return {
      message: res.simulated
        ? "Test email simulated (add RESEND_API_KEY to send for real)."
        : `Test email sent to ${user.email}.`,
    };
  }

  if (!profile?.phone) {
    return { error: "Add a phone number in Settings to test SMS." };
  }
  const res = await sendMessage({ channel: "sms", to: profile.phone, body });
  if (!res.ok) return { error: res.error ?? "Send failed." };
  return {
    message: res.simulated
      ? "Test SMS simulated (add Twilio keys to send for real)."
      : `Test SMS sent to ${profile.phone}.`,
  };
}
