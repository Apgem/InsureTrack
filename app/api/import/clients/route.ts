import { NextResponse } from "next/server";

import type { PolicyType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

type MappedRow = {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string;
  policy_type?: string;
  carrier?: string;
  policy_number?: string;
  premium?: string;
  renewal_date?: string;
};

const VALID_POLICY_TYPES: PolicyType[] = [
  "auto",
  "home",
  "life",
  "health",
  "commercial",
];

function normalizePhone(v?: string): string | null {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  return digits.length ? digits : null;
}

function clean(v?: string): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { rows?: MappedRow[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const rows = body.rows ?? [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  // Build dedup maps from the agent's existing clients.
  const { data: existing } = await supabase
    .from("clients")
    .select("id, email, phone");

  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  for (const c of existing ?? []) {
    if (c.email) byEmail.set(c.email.trim().toLowerCase(), c.id);
    const np = normalizePhone(c.phone ?? undefined);
    if (np) byPhone.set(np, c.id);
  }

  let imported = 0;
  let matched = 0;
  let skipped = 0;
  let policiesAdded = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const fullName = clean(row.full_name);
    if (!fullName) {
      skipped++;
      continue;
    }

    const email = clean(row.email)?.toLowerCase() ?? null;
    const phone = normalizePhone(row.phone);

    // Dedup: email first, then phone fallback (NULL email is common).
    let clientId: string | undefined;
    if (email) clientId = byEmail.get(email);
    if (!clientId && phone) clientId = byPhone.get(phone);

    if (clientId) {
      matched++;
    } else {
      const tags = clean(row.tags)
        ? clean(row.tags)!
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : null;

      const { data: inserted, error } = await supabase
        .from("clients")
        .insert({
          agent_id: user.id,
          full_name: fullName,
          email: clean(row.email),
          phone: clean(row.phone),
          address: clean(row.address),
          notes: clean(row.notes),
          tags: tags && tags.length ? tags : null,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        errors.push(`${fullName}: ${error?.message ?? "insert failed"}`);
        continue;
      }
      clientId = inserted.id;
      imported++;
      if (email) byEmail.set(email, clientId);
      if (phone) byPhone.set(phone, clientId);
    }

    // Optionally attach a policy if mapped.
    const ptRaw = clean(row.policy_type)?.toLowerCase();
    const renewal = clean(row.renewal_date);
    if (ptRaw && renewal && VALID_POLICY_TYPES.includes(ptRaw as PolicyType)) {
      const premiumNum = row.premium ? Number(row.premium) : null;
      const { error: pErr } = await supabase.from("policies").insert({
        agent_id: user.id,
        client_id: clientId,
        policy_type: ptRaw as PolicyType,
        carrier: clean(row.carrier),
        policy_number: clean(row.policy_number),
        premium: premiumNum != null && !isNaN(premiumNum) ? premiumNum : null,
        renewal_date: renewal,
        status: "active",
      });
      if (!pErr) policiesAdded++;
    }
  }

  return NextResponse.json({
    imported,
    matched,
    skipped,
    policiesAdded,
    errors,
  });
}
