import type { Metadata } from "next";

import type { PolicyType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/format";
import {
  RenewalCard,
  type RenewalItem,
} from "@/components/renewals/renewal-card";

export const metadata: Metadata = {
  title: "Renewals · InsureTrack",
};

type Bucket = { label: string; hint: string; items: RenewalItem[] };

export default async function RenewalsPage() {
  const supabase = createClient();

  const [{ data: policies }, { data: clients }] = await Promise.all([
    supabase
      .from("policies")
      .select("id, client_id, policy_type, carrier, renewal_date, status")
      .eq("status", "active"),
    supabase.from("clients").select("id, full_name"),
  ]);

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.full_name]));

  const items: RenewalItem[] = (policies ?? [])
    .map((p) => ({
      policyId: p.id,
      clientId: p.client_id,
      clientName: clientName.get(p.client_id) ?? "Client",
      policyType: p.policy_type as PolicyType,
      carrier: p.carrier,
      renewalDate: p.renewal_date,
      days: daysUntil(p.renewal_date) ?? 99999,
    }))
    .filter((i) => i.days >= 0 && i.days <= 90)
    .sort((a, b) => a.days - b.days);

  const buckets: Bucket[] = [
    {
      label: "30 days",
      hint: "Renewing within a month",
      items: items.filter((i) => i.days <= 30),
    },
    {
      label: "60 days",
      hint: "31–60 days out",
      items: items.filter((i) => i.days > 30 && i.days <= 60),
    },
    {
      label: "90 days",
      hint: "61–90 days out",
      items: items.filter((i) => i.days > 60 && i.days <= 90),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Renewals</h1>
        <p className="text-sm text-muted-foreground">
          Active policies renewing in the next 90 days. Send a reminder or mark
          the outcome.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {buckets.map((b) => (
          <div key={b.label} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">{b.label}</h2>
              <span className="text-xs text-muted-foreground">
                {b.items.length} · {b.hint}
              </span>
            </div>
            {b.items.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nothing here.
              </p>
            ) : (
              <div className="space-y-3">
                {b.items.map((item) => (
                  <RenewalCard key={item.policyId} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
