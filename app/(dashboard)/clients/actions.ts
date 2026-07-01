"use server";

import { revalidatePath } from "next/cache";

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  clientSchema,
  policySchema,
  type ClientInput,
  type PolicyInput,
} from "@/lib/validations";

export type ActionResult = { error?: string; id?: string };

async function getAgent() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function createClientRecord(
  input: ClientInput
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("clients")
    .insert({
      agent_id: user.id,
      full_name: parsed.data.full_name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      notes: parsed.data.notes ?? null,
      tags: parsed.data.tags.length ? parsed.data.tags : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clients");
  return { id: data.id };
}

export async function updateClientRecord(
  id: string,
  input: ClientInput
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: parsed.data.full_name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      notes: parsed.data.notes ?? null,
      tags: parsed.data.tags.length ? parsed.data.tags : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { id };
}

export async function deleteClientRecord(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clients");
  return {};
}

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

export async function createPolicyRecord(
  input: PolicyInput
): Promise<ActionResult> {
  const parsed = policySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("policies")
    .insert({
      agent_id: user.id,
      client_id: parsed.data.client_id,
      policy_type: parsed.data.policy_type,
      carrier: parsed.data.carrier ?? null,
      policy_number: parsed.data.policy_number ?? null,
      premium: parsed.data.premium ?? null,
      renewal_date: parsed.data.renewal_date,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/clients/${parsed.data.client_id}`);
  return { id: data.id };
}

export async function updatePolicyRecord(
  id: string,
  input: PolicyInput
): Promise<ActionResult> {
  const parsed = policySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("policies")
    .update({
      policy_type: parsed.data.policy_type,
      carrier: parsed.data.carrier ?? null,
      policy_number: parsed.data.policy_number ?? null,
      premium: parsed.data.premium ?? null,
      renewal_date: parsed.data.renewal_date,
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/clients/${parsed.data.client_id}`);
  return { id };
}

export async function deletePolicyRecord(
  id: string,
  clientId: string
): Promise<ActionResult> {
  const { supabase, user } = await getAgent();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("policies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return {};
}
