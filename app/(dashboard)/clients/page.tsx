import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";

import type { PolicyType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ClientFormSheet } from "@/components/clients/client-form-sheet";
import {
  ClientsTable,
  type ClientListRow,
} from "@/components/clients/clients-table";

export const metadata: Metadata = {
  title: "Clients · InsureTrack",
};

export default async function ClientsPage() {
  const supabase = createClient();

  const [{ data: clients }, { data: policies }, { data: messages }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, email, phone")
        .order("full_name"),
      supabase
        .from("policies")
        .select("client_id, policy_type, renewal_date, status"),
      supabase
        .from("messages_log")
        .select("client_id, sent_at")
        .order("sent_at", { ascending: false }),
    ]);

  // Group policies by client.
  const policiesByClient = new Map<
    string,
    { policy_type: PolicyType; renewal_date: string; status: string | null }[]
  >();
  for (const p of policies ?? []) {
    const list = policiesByClient.get(p.client_id) ?? [];
    list.push(p);
    policiesByClient.set(p.client_id, list);
  }

  // Latest message per client (messages already sorted desc).
  const lastContactByClient = new Map<string, string>();
  for (const m of messages ?? []) {
    if (m.client_id && m.sent_at && !lastContactByClient.has(m.client_id)) {
      lastContactByClient.set(m.client_id, m.sent_at);
    }
  }

  const rows: ClientListRow[] = (clients ?? []).map((c) => {
    const ps = policiesByClient.get(c.id) ?? [];
    const policyTypes = Array.from(new Set(ps.map((p) => p.policy_type)));
    const nextRenewal = ps
      .filter((p) => p.status === "active" && p.renewal_date)
      .map((p) => p.renewal_date)
      .sort()[0];
    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      policyTypes,
      nextRenewal: nextRenewal ?? null,
      lastContacted: lastContactByClient.get(c.id) ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
            Clients
          </h1>
          <p className="text-sm text-[#5a6475]">
            People who already hold policies with you — track renewals and
            enroll them in follow-ups. New prospects live under{" "}
            <Link href="/leads" className="font-medium text-[#3B5E91] hover:underline">
              Leads
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/clients/import">
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <ClientFormSheet
            mode="create"
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Add client
              </Button>
            }
          />
        </div>
      </div>

      <ClientsTable clients={rows} />
    </div>
  );
}
