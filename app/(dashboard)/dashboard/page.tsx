import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Lightbulb,
  UserPlus,
} from "lucide-react";

import type { PolicyType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { getCrossSellSuggestions } from "@/lib/cross-sell";
import { daysUntil, formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard · InsureTrack",
};

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ data: clients }, { data: policies }, { data: leads }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("policies")
        .select("client_id, policy_type, carrier, renewal_date, status"),
      supabase.from("leads").select("status"),
    ]);

  const clientList = clients ?? [];
  const policyList = policies ?? [];
  const leadList = leads ?? [];
  const clientName = new Map(clientList.map((c) => [c.id, c.full_name]));

  // --- Stats ---
  const totalClients = clientList.length;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();
  const renewalsThisMonth = policyList.filter((p) => {
    if (p.status !== "active" || !p.renewal_date) return false;
    const [y, m] = p.renewal_date.split("-").map(Number);
    return y === curYear && m - 1 === curMonth;
  }).length;

  const renewed = policyList.filter((p) => p.status === "renewed").length;
  const lapsed = policyList.filter(
    (p) => p.status === "lapsed" || p.status === "cancelled"
  ).length;
  const retentionRate =
    renewed + lapsed > 0
      ? `${Math.round((renewed / (renewed + lapsed)) * 100)}%`
      : "—";

  const activeLeads = leadList.filter(
    (l) =>
      l.status === "new" || l.status === "contacted" || l.status === "quoted"
  ).length;

  const stats = [
    { label: "Total clients", value: String(totalClients) },
    { label: "Renewals this month", value: String(renewalsThisMonth) },
    { label: "Retention rate", value: retentionRate },
    { label: "Active leads", value: String(activeLeads) },
  ];

  // --- Upcoming renewals (next 30 days) ---
  const upcoming = policyList
    .filter((p) => p.status === "active" && p.renewal_date)
    .map((p) => ({ ...p, days: daysUntil(p.renewal_date) ?? 9999 }))
    .filter((p) => p.days >= 0 && p.days <= 30)
    .sort((a, b) => a.days - b.days);

  const within7 = upcoming.filter((p) => p.days <= 7).length;
  const within30 = upcoming.filter((p) => p.days > 7).length;

  const recentClients = clientList.slice(0, 5);

  // --- Cross-sell opportunities ---
  const activeTypesByClient = new Map<string, Set<PolicyType>>();
  for (const p of policyList) {
    if (p.status === "active") {
      const s = activeTypesByClient.get(p.client_id) ?? new Set<PolicyType>();
      s.add(p.policy_type as PolicyType);
      activeTypesByClient.set(p.client_id, s);
    }
  }
  const crossSell = clientList
    .map((c) => ({
      id: c.id,
      name: c.full_name,
      missing: getCrossSellSuggestions(
        Array.from(activeTypesByClient.get(c.id) ?? [])
      ),
    }))
    .filter((x) => x.missing.length > 0)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your book of business at a glance.
        </p>
      </div>

      {/* Renewal alert strip */}
      {(within7 > 0 || within30 > 0) && (
        <Link
          href="/renewals"
          className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted"
        >
          {within7 > 0 && (
            <span className="flex items-center gap-2 font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {within7} {within7 === 1 ? "policy renews" : "policies renew"}{" "}
              within 7 days
            </span>
          )}
          {within30 > 0 && (
            <span className="flex items-center gap-2 font-medium text-amber-600">
              <CalendarClock className="h-4 w-4" />
              {within30} more within 30 days
            </span>
          )}
          <span className="ml-auto text-muted-foreground">
            View renewals →
          </span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5" />
              Upcoming renewals
            </CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No renewals in the next 30 days.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 6).map((p, i) => (
                  <Link
                    key={i}
                    href={`/clients/${p.client_id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="font-medium">
                      {clientName.get(p.client_id) ?? "Client"}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {POLICY_TYPE_LABELS[p.policy_type as PolicyType]}
                      </Badge>
                      <span
                        className={
                          p.days <= 7
                            ? "font-medium text-destructive"
                            : "text-amber-600"
                        }
                      >
                        {p.days === 0 ? "today" : `${p.days}d`}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" />
              Recently added
            </CardTitle>
            <CardDescription>Newest clients</CardDescription>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clients yet.{" "}
                <Link href="/clients" className="text-primary hover:underline">
                  Add your first client
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-2">
                {recentClients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{c.full_name}</span>
                    <span className="text-muted-foreground">
                      {formatDate(c.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            Cross-sell opportunities
          </CardTitle>
          <CardDescription>
            Clients missing a core bundle policy (auto / home / life)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {crossSell.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No cross-sell gaps right now. Add policies to clients to surface
              opportunities here.
            </p>
          ) : (
            <div className="space-y-2">
              {crossSell.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    missing{" "}
                    {c.missing.map((t) => POLICY_TYPE_LABELS[t]).join(", ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
