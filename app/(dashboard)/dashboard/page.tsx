import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Lightbulb,
  UserPlus,
} from "lucide-react";

import type { PolicyType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { getCrossSellSuggestions } from "@/lib/cross-sell";
import { daysUntil, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CrossSellAlert } from "@/components/cross-sell-alert";

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

  // --- Upcoming renewals (next 30 days) ---
  const upcoming = policyList
    .filter((p) => p.status === "active" && p.renewal_date)
    .map((p) => ({ ...p, days: daysUntil(p.renewal_date) ?? 9999 }))
    .filter((p) => p.days >= 0 && p.days <= 30)
    .sort((a, b) => a.days - b.days);

  const within7 = upcoming.filter((p) => p.days <= 7).length;
  const within30 = upcoming.filter((p) => p.days > 7).length;
  const recentClients = clientList.slice(0, 5);

  const stats = [
    {
      label: "Total clients",
      value: String(totalClients),
      sub: "in your book of business",
      valueClass: "text-[#1a1a1a]",
    },
    {
      label: "Renewals due",
      value: String(upcoming.length),
      sub: "in the next 30 days",
      valueClass: "text-[#C17B8A]",
    },
    {
      label: "Retention rate",
      value: retentionRate,
      sub: "renewed vs. lapsed",
      valueClass: "text-[#6B9E7A]",
    },
    {
      label: "Active leads",
      value: String(activeLeads),
      sub: "in your pipeline",
      valueClass: "text-[#1a1a1a]",
    },
  ];

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
    .map((c) => {
      const has = Array.from(activeTypesByClient.get(c.id) ?? []);
      return { id: c.id, name: c.full_name, has, missing: getCrossSellSuggestions(has) };
    })
    .filter((x) => x.missing.length > 0);

  // --- Today's actions (max 3): urgent renewals (rose) then cross-sell (amber) ---
  type Action = {
    key: string;
    text: string;
    name: string;
    href: string;
    border: string;
  };
  const actions: Action[] = [
    ...upcoming.slice(0, 3).map((p, i) => ({
      key: `r-${i}`,
      text: p.days <= 7 ? "Renewal due this week" : "Renewal coming up",
      name: clientName.get(p.client_id) ?? "Client",
      href: "/renewals",
      border: "#C17B8A",
    })),
    ...crossSell.slice(0, 3).map((c) => ({
      key: `c-${c.id}`,
      text: "Cross-sell opportunity",
      name: c.name,
      href: `/clients/${c.id}`,
      border: "#E8A838",
    })),
  ].slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
          Dashboard
        </h1>
        <p className="text-sm text-[#5a6475]">
          Your book of business at a glance.
        </p>
      </div>

      {/* Renewal alert strip */}
      {(within7 > 0 || within30 > 0) && (
        <Link
          href="/renewals"
          className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-[14px] border border-[#E5E5E0] bg-white px-4 py-3 text-sm transition-colors hover:bg-[#FAFAF8]"
        >
          {within7 > 0 && (
            <span className="flex items-center gap-2 font-semibold text-[#C94040]">
              <AlertTriangle className="h-4 w-4" />
              {within7} {within7 === 1 ? "policy renews" : "policies renew"}{" "}
              within 7 days
            </span>
          )}
          {within30 > 0 && (
            <span className="flex items-center gap-2 font-semibold text-[#B87A1A]">
              <CalendarClock className="h-4 w-4" />
              {within30} more within 30 days
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[#5a6475]">
            View renewals <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[14px] border border-[#E5E5E0] bg-white px-5 py-[18px]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#9A9A94]">
              {stat.label}
            </p>
            <p className={cn("mt-2 text-[28px] font-bold leading-none", stat.valueClass)}>
              {stat.value}
            </p>
            <p className="mt-2 text-xs text-[#9A9A94]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Today's actions */}
      {actions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[#1a1a1a]">Today’s actions</h2>
          <div className="space-y-2">
            {actions.map((a) => (
              <div
                key={a.key}
                className="flex items-center justify-between rounded-[10px] border border-[#E5E5E0] bg-white px-4 py-3"
                style={{ borderLeft: `3px solid ${a.border}` }}
              >
                <div className="min-w-0 text-sm">
                  <span className="text-[#5a6475]">{a.text} · </span>
                  <span className="font-semibold text-[#1a1a1a]">{a.name}</span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={a.href}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-sell opportunities (top 2 as rich alerts) */}
      {crossSell.length > 0 && (
        <div className="space-y-3">
          {crossSell.slice(0, 2).map((c) => (
            <CrossSellAlert
              key={c.id}
              clientId={c.id}
              clientName={c.name}
              has={c.has}
              missing={c.missing}
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[14px] border-[#E5E5E0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-[#3B5E91]" />
              Upcoming renewals
            </CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#9A9A94]">
                No renewals in the next 30 days.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 6).map((p, i) => {
                  const urgent = p.days <= 7;
                  return (
                    <Link
                      key={i}
                      href={`/clients/${p.client_id}`}
                      style={{
                        borderLeftColor: urgent ? "#C94040" : "#E8A838",
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-[10px] border border-[#F2F2EF] border-l-[3px] px-3 py-2 text-sm transition-colors hover:bg-[#FAFAF8]",
                        urgent &&
                          "animate-[pulse-border_2.8s_ease-in-out_infinite]"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1a1a1a]">
                          {clientName.get(p.client_id) ?? "Client"}
                        </p>
                        <p className="text-xs text-[#9A9A94]">
                          {POLICY_TYPE_LABELS[p.policy_type as PolicyType]}
                          {p.carrier ? ` · ${p.carrier}` : ""}
                        </p>
                      </div>
                      <Badge variant={urgent ? "urgent" : "soon"} dot>
                        {p.days === 0 ? "today" : `${p.days} days`}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border-[#E5E5E0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-[#3B5E91]" />
              Recently added
            </CardTitle>
            <CardDescription>Newest clients</CardDescription>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <p className="text-sm text-[#9A9A94]">
                No clients yet.{" "}
                <Link href="/clients" className="text-[#3B5E91] hover:underline">
                  Add your first client
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-1">
                {recentClients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="flex items-center justify-between rounded-[8px] px-2 py-1.5 text-sm transition-colors hover:bg-[#FAFAF8]"
                  >
                    <span className="font-semibold text-[#1a1a1a]">
                      {c.full_name}
                    </span>
                    <span className="text-[#9A9A94]">
                      {formatDate(c.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {crossSell.length === 0 && (
        <Card className="rounded-[14px] border-[#E5E5E0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-[#3B5E91]" />
              Cross-sell opportunities
            </CardTitle>
            <CardDescription>
              Clients missing a core bundle policy (auto / home / life)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#9A9A94]">
              No cross-sell gaps right now. Add policies to clients to surface
              opportunities here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}