"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Search, Upload, Users } from "lucide-react";

import type { PolicyType } from "@/types/database";
import { POLICY_TYPES, POLICY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ClientListRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  policyTypes: PolicyType[];
  nextRenewal: string | null;
  lastContacted: string | null;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ClientsTable({ clients }: { clients: ClientListRow[] }) {
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [monthFilter, setMonthFilter] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (q) {
        const hay = `${c.full_name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter !== "all" && !c.policyTypes.includes(typeFilter as PolicyType)) {
        return false;
      }
      if (monthFilter !== "all") {
        if (!c.nextRenewal) return false;
        const m = new Date(c.nextRenewal).getMonth();
        if (m !== Number(monthFilter)) return false;
      }
      return true;
    });
  }, [clients, query, typeFilter, monthFilter]);

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Upload a CSV or add your first client to start tracking renewals."
        action={
          <Button asChild size="sm">
            <Link href="/clients/import">
              <Upload className="h-4 w-4" />
              Import your book of business
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or phone…"
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Policy type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All policy types</SelectItem>
            {POLICY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Renewal month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any renewal month</SelectItem>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#E5E5E0] bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Policy types</TableHead>
              <TableHead>Next renewal</TableHead>
              <TableHead>Last contacted</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {clients.length === 0
                    ? "No clients yet. Add your first client or import a CSV."
                    : "No clients match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/clients/${c.id}`}
                      className="block hover:underline"
                    >
                      {c.full_name}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {c.email ?? c.phone ?? "—"}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {c.policyTypes.length ? (
                      <div className="flex flex-wrap gap-1">
                        {c.policyTypes.map((t) => (
                          <Badge key={t} variant="secondary">
                            {POLICY_TYPE_LABELS[t]}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(c.nextRenewal)}</TableCell>
                  <TableCell>{formatDate(c.lastContacted)}</TableCell>
                  <TableCell>
                    <Link href={`/clients/${c.id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {clients.length} client
        {clients.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
