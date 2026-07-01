import { NextResponse } from "next/server";

import type { PolicyType } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { renderTemplate, sendMessage } from "@/lib/messaging";

// Run on the Node runtime (needs the service-role key + SDKs).
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  // --- Auth gate FIRST. Vercel cron sends `Authorization: Bearer <CRON_SECRET>`.
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = isoDay(today);

  let enrolled = 0;
  let sent = 0;
  let completed = 0;
  let skipped = 0;
  const errors: string[] = [];

  // ---------------------------------------------------------------------------
  // 1. Auto-enroll: renewal_30 / renewal_60 / renewal_90
  //    Enroll clients whose active policy renews within N days and who are not
  //    already actively enrolled in that sequence (the partial unique index is
  //    the backstop).
  // ---------------------------------------------------------------------------
  const { data: sequences } = await supabase
    .from("sequences")
    .select("id, agent_id, trigger_type")
    .eq("is_active", true);

  const renewalSeqs = (sequences ?? []).filter((s) =>
    s.trigger_type.startsWith("renewal_")
  );

  for (const seq of renewalSeqs) {
    const n = Number(seq.trigger_type.split("_")[1]); // 30 | 60 | 90
    const limit = new Date(today);
    limit.setDate(limit.getDate() + n);

    const { data: pols } = await supabase
      .from("policies")
      .select("client_id")
      .eq("agent_id", seq.agent_id)
      .eq("status", "active")
      .gte("renewal_date", todayStr)
      .lte("renewal_date", isoDay(limit));

    const clientIds = Array.from(
      new Set((pols ?? []).map((p) => p.client_id))
    );
    if (clientIds.length === 0) continue;

    // Guard against re-enrollment within the same renewal cycle: skip clients
    // with an active OR recently-completed enrollment (last 180 days). Without
    // the completed check, a finished single-step sequence would re-enroll and
    // re-send every day until the policy leaves the window. The 180-day window
    // still allows re-enrollment for next year's renewal.
    const recencyCutoff = new Date(today);
    recencyCutoff.setDate(recencyCutoff.getDate() - 180);
    const { data: existing } = await supabase
      .from("sequence_enrollments")
      .select("client_id")
      .eq("sequence_id", seq.id)
      .in("status", ["active", "completed"])
      .gte("enrolled_at", recencyCutoff.toISOString());
    const already = new Set((existing ?? []).map((e) => e.client_id));

    for (const clientId of clientIds) {
      if (already.has(clientId)) continue;
      const { error } = await supabase.from("sequence_enrollments").insert({
        sequence_id: seq.id,
        client_id: clientId,
        current_step: 0,
        status: "active",
      });
      if (!error) enrolled++;
      else if (!error.message.toLowerCase().includes("duplicate"))
        errors.push(`enroll ${seq.trigger_type}: ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1b. Auto-enroll: new_client (welcome) sequences. Enroll clients created in
  //     the last 7 days who aren't already enrolled.
  // ---------------------------------------------------------------------------
  const guardCutoff = new Date(today);
  guardCutoff.setDate(guardCutoff.getDate() - 180);
  const newClientWindow = new Date(today);
  newClientWindow.setDate(newClientWindow.getDate() - 7);

  const newClientSeqs = (sequences ?? []).filter(
    (s) => s.trigger_type === "new_client"
  );

  for (const seq of newClientSeqs) {
    const { data: recentClients } = await supabase
      .from("clients")
      .select("id")
      .eq("agent_id", seq.agent_id)
      .gte("created_at", newClientWindow.toISOString());
    const clientIds = (recentClients ?? []).map((c) => c.id);
    if (clientIds.length === 0) continue;

    const { data: existing } = await supabase
      .from("sequence_enrollments")
      .select("client_id")
      .eq("sequence_id", seq.id)
      .in("status", ["active", "completed"])
      .gte("enrolled_at", guardCutoff.toISOString());
    const already = new Set((existing ?? []).map((e) => e.client_id));

    for (const clientId of clientIds) {
      if (already.has(clientId)) continue;
      const { error } = await supabase.from("sequence_enrollments").insert({
        sequence_id: seq.id,
        client_id: clientId,
        current_step: 0,
        status: "active",
      });
      if (!error) enrolled++;
      else if (!error.message.toLowerCase().includes("duplicate"))
        errors.push(`enroll new_client: ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1c. Auto-enroll: new_lead sequences. Enroll leads created in the last 7
  //     days who aren't already enrolled (e.g. nurture a fresh prospect).
  // ---------------------------------------------------------------------------
  const newLeadSeqs = (sequences ?? []).filter(
    (s) => s.trigger_type === "new_lead"
  );

  for (const seq of newLeadSeqs) {
    const { data: recentLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("agent_id", seq.agent_id)
      .gte("created_at", newClientWindow.toISOString());
    const leadIds = (recentLeads ?? []).map((l) => l.id);
    if (leadIds.length === 0) continue;

    const { data: existing } = await supabase
      .from("sequence_enrollments")
      .select("lead_id")
      .eq("sequence_id", seq.id)
      .in("status", ["active", "completed"])
      .gte("enrolled_at", guardCutoff.toISOString());
    const already = new Set((existing ?? []).map((e) => e.lead_id));

    for (const leadId of leadIds) {
      if (already.has(leadId)) continue;
      const { error } = await supabase.from("sequence_enrollments").insert({
        sequence_id: seq.id,
        lead_id: leadId,
        current_step: 0,
        status: "active",
      });
      if (!error) enrolled++;
      else if (!error.message.toLowerCase().includes("duplicate"))
        errors.push(`enroll new_lead: ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Process active enrollments — send the next step if its cumulative delay
  //    (from enrolled_at) is due today.
  // ---------------------------------------------------------------------------
  const { data: enrollments } = await supabase
    .from("sequence_enrollments")
    .select("id, sequence_id, client_id, lead_id, current_step, enrolled_at")
    .eq("status", "active");

  const stepsCache = new Map<
    string,
    {
      channel: string;
      delay_days: number | null;
      subject: string | null;
      body: string;
    }[]
  >();
  async function getSteps(sequenceId: string) {
    if (stepsCache.has(sequenceId)) return stepsCache.get(sequenceId)!;
    const { data } = await supabase
      .from("sequence_steps")
      .select("channel, delay_days, subject, body")
      .eq("sequence_id", sequenceId)
      .order("step_order", { ascending: true });
    const steps = data ?? [];
    stepsCache.set(sequenceId, steps);
    return steps;
  }

  for (const enr of enrollments ?? []) {
    const steps = await getSteps(enr.sequence_id);
    const idx = enr.current_step ?? 0;

    if (idx >= steps.length) {
      await supabase
        .from("sequence_enrollments")
        .update({ status: "completed" })
        .eq("id", enr.id);
      completed++;
      continue;
    }

    const step = steps[idx];
    const enrolledAt = new Date(enr.enrolled_at ?? todayStr);
    enrolledAt.setHours(0, 0, 0, 0);
    const due = new Date(enrolledAt);
    due.setDate(due.getDate() + (step.delay_days ?? 0));
    if (due > today) continue; // not due yet

    // Resolve the recipient — an enrollment targets either a client or a lead.
    let recipientName: string;
    let recipientEmail: string | null;
    let recipientPhone: string | null;
    let recipientOptedOut = false;
    let agentId: string;
    let renewalDate = "";
    let policyType = "";

    if (enr.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("full_name, email, phone, sms_opted_out, agent_id")
        .eq("id", enr.client_id)
        .maybeSingle();
      if (!client) continue;

      const { data: pol } = await supabase
        .from("policies")
        .select("policy_type, renewal_date")
        .eq("client_id", enr.client_id)
        .eq("status", "active")
        .order("renewal_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      recipientName = client.full_name;
      recipientEmail = client.email;
      recipientPhone = client.phone;
      recipientOptedOut = client.sms_opted_out;
      agentId = client.agent_id;
      renewalDate = pol ? formatDate(pol.renewal_date) : "";
      policyType = pol
        ? POLICY_TYPE_LABELS[pol.policy_type as PolicyType]
        : "";
    } else if (enr.lead_id) {
      const { data: lead } = await supabase
        .from("leads")
        .select("full_name, email, phone, agent_id")
        .eq("id", enr.lead_id)
        .maybeSingle();
      if (!lead) continue;

      recipientName = lead.full_name;
      recipientEmail = lead.email;
      recipientPhone = lead.phone;
      agentId = lead.agent_id;
      // Leads have no policy — renewal_date/policy_type vars stay empty.
    } else {
      continue;
    }

    const vars = {
      first_name: recipientName.trim().split(/\s+/)[0],
      renewal_date: renewalDate,
      policy_type: policyType,
    };
    const channel = step.channel as "email" | "sms";
    const body = renderTemplate(step.body, vars);
    const subject = step.subject ? renderTemplate(step.subject, vars) : null;
    const recipient = channel === "email" ? recipientEmail : recipientPhone;

    let status: "sent" | "failed" = "sent";
    if (channel === "sms" && recipientOptedOut) {
      status = "failed";
      skipped++;
    } else if (!recipient) {
      status = "failed";
      skipped++;
    } else {
      const res = await sendMessage({ channel, to: recipient, subject, body });
      if (res.ok) {
        status = "sent";
        sent++;
      } else {
        status = "failed";
        if (res.error) errors.push(res.error);
      }
    }

    // Audit every attempt (incl. opt-out / missing-contact skips).
    await supabase.from("messages_log").insert({
      agent_id: agentId,
      client_id: enr.client_id,
      lead_id: enr.lead_id,
      enrollment_id: enr.id,
      channel,
      subject,
      body,
      status,
    });

    const nextStep = idx + 1;
    const nextStatus = nextStep >= steps.length ? "completed" : "active";
    if (nextStatus === "completed") completed++;
    await supabase
      .from("sequence_enrollments")
      .update({ current_step: nextStep, status: nextStatus })
      .eq("id", enr.id);
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    enrolled,
    sent,
    completed,
    skipped,
    errors,
  });
}
