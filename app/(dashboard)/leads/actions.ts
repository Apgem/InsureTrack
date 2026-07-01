"use server";

import { revalidatePath } from "next/cache";

import type { LeadStatus } from "@/types/database";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { leadSchema, type LeadInput } from "@/lib/validations";

export type LeadActionResult = { error?: string; id?: string };

const STATUSES: LeadStatus[] = ["new", "contacted", "quoted", "won", "lost"];

async function getAgent() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createLead(input: LeadInput): Promise<LeadActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("leads")
    .insert({
      agent_id: user.id,
      full_name: parsed.data.full_name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      source: parsed.data.source ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      interested_in: parsed.data.interested_in.length
        ? parsed.data.interested_in
        : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { id: data.id };
}

export async function updateLead(
  id: string,
  input: LeadInput
): Promise<LeadActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("leads")
    .update({
      full_name: parsed.data.full_name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      source: parsed.data.source ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      interested_in: parsed.data.interested_in.length
        ? parsed.data.interested_in
        : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { id };
}

/** Lightweight status update used by the kanban drag-and-drop. */
export async function updateLeadStatus(
  id: string,
  status: string
): Promise<LeadActionResult> {
  if (!STATUSES.includes(status as LeadStatus)) {
    return { error: "Invalid status." };
  }
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("leads")
    .update({ status: status as LeadStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { id };
}

export async function deleteLead(id: string): Promise<LeadActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return {};
}

/**
 * Convert a won lead into a client. Creates the client record (the daily cron's
 * new_client welcome enrollment then picks it up) and marks the lead "won".
 */
export async function convertLeadToClient(
  id: string
): Promise<LeadActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { data: lead } = await supabase
    .from("leads")
    .select("full_name, email, phone")
    .eq("id", id)
    .maybeSingle();
  if (!lead) return { error: "Lead not found." };

  const { data: client, error: cErr } = await supabase
    .from("clients")
    .insert({
      agent_id: user.id,
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone,
    })
    .select("id")
    .single();
  if (cErr) return { error: cErr.message };

  await supabase.from("leads").update({ status: "won" }).eq("id", id);

  revalidatePath("/leads");
  revalidatePath("/clients");
  return { id: client.id };
}
