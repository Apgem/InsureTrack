"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  startCheckout,
  openBillingPortal,
  simulateSetStatus,
  type SettingsResult,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";

type Action = () => Promise<SettingsResult>;

function ActionButton({
  run,
  children,
  variant,
}: {
  run: Action;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function onClick() {
    setError(null);
    setMsg(null);
    startTransition(async () => {
      // A successful checkout/portal call redirects and never returns here.
      const res = await run();
      if (res?.error) setError(res.error);
      else if (res?.message) {
        setMsg(res.message);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button variant={variant} onClick={onClick} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
    </div>
  );
}

export function UpgradeButton({ label = "Upgrade to Pro" }: { label?: string }) {
  return <ActionButton run={startCheckout}>{label}</ActionButton>;
}

export function ManageBillingButton() {
  return (
    <ActionButton run={openBillingPortal} variant="outline">
      Manage billing
    </ActionButton>
  );
}

/** Only rendered in simulate mode (no Stripe keys) to exercise the paywall. */
export function SimulateControls({
  status,
}: {
  status: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "active" && (
        <ActionButton run={() => simulateSetStatus("active")}>
          Simulate activate
        </ActionButton>
      )}
      {status !== "canceled" && (
        <ActionButton
          run={() => simulateSetStatus("canceled")}
          variant="secondary"
        >
          Simulate cancel
        </ActionButton>
      )}
      <ActionButton
        run={() => simulateSetStatus("trialing")}
        variant="outline"
      >
        Restart trial
      </ActionButton>
    </div>
  );
}