"use client";

import * as React from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";

import type { PolicyType } from "@/types/database";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

// Rough typical annual premium per line, used only for the suggestion copy.
const PREMIUM_ESTIMATE: Record<PolicyType, number> = {
  auto: 1200,
  home: 1400,
  life: 600,
  health: 3200,
  commercial: 2600,
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CrossSellAlert({
  clientId,
  clientName,
  has,
  missing,
}: {
  clientId: string;
  clientName: string;
  has: PolicyType[];
  missing: PolicyType[];
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed || missing.length === 0) return null;

  const firstMissing = missing[0];
  const estimate = formatUsd(PREMIUM_ESTIMATE[firstMissing]);
  const hasLabel = has.map((t) => POLICY_TYPE_LABELS[t]).join(", ");
  const missingLabel = missing.map((t) => POLICY_TYPE_LABELS[t]).join(" or ");

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-[#F5C4D0] bg-[#FFF0F3] px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#C17B8A]">
          <Lightbulb className="h-4 w-4 text-white" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#9A4F60]">
            Cross-sell opportunity · {clientName}
          </p>
          <p className="mt-1 text-sm text-[#5a6475]">
            {has.length > 0 ? (
              <>
                {clientName} has {hasLabel} but no {missingLabel}. Adding{" "}
                {POLICY_TYPE_LABELS[firstMissing]} could increase their annual
                premium by ~{estimate}.
              </>
            ) : (
              <>
                {clientName} has no {missingLabel} coverage yet — a natural
                cross-sell worth ~{estimate}/yr.
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 pl-11 sm:pl-0">
        <Button asChild variant="rose" size="sm">
          <Link href={`/clients/${clientId}`}>Reach out now</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}