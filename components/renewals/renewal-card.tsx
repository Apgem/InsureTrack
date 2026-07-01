"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Send } from "lucide-react";

import type { PolicyType } from "@/types/database";
import {
  sendRenewalReminder,
  setPolicyStatus,
} from "@/app/(dashboard)/renewals/actions";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type RenewalItem = {
  policyId: string;
  clientId: string;
  clientName: string;
  policyType: PolicyType;
  carrier: string | null;
  renewalDate: string;
  days: number;
};

export function RenewalCard({ item }: { item: RenewalItem }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function mark(status: "renewed" | "lapsed") {
    setError(null);
    startTransition(async () => {
      const res = await setPolicyStatus(item.policyId, status);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function remind() {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const res = await sendRenewalReminder(item.policyId);
      if (res.error) setError(res.error);
      else setFeedback(res.message ?? "Reminder sent.");
    });
  }

  const urgency =
    item.days <= 7 ? "text-destructive" : "text-amber-600";

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/clients/${item.clientId}`}
          className="font-medium hover:underline"
        >
          {item.clientName}
        </Link>
        <span className={`shrink-0 text-sm font-medium ${urgency}`}>
          {item.days === 0 ? "today" : `${item.days}d`}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Badge variant="secondary">{POLICY_TYPE_LABELS[item.policyType]}</Badge>
        <span className="text-sm text-muted-foreground">
          {item.carrier ?? "No carrier"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Renews {formatDate(item.renewalDate)}
      </p>

      {feedback && (
        <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          {feedback}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={remind}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Send reminder
        </Button>
        <Button size="sm" onClick={() => mark("renewed")} disabled={isPending}>
          Renewed
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => mark("lapsed")}
          disabled={isPending}
        >
          Lapsed
        </Button>
      </div>
    </div>
  );
}
