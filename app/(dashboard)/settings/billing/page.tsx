import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured, PLAN } from "@/lib/stripe";
import { getEntitlement } from "@/lib/subscription";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  UpgradeButton,
  ManageBillingButton,
  SimulateControls,
} from "@/components/settings/billing-actions";

export const metadata: Metadata = {
  title: "Billing · InsureTrack",
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const ent = getEntitlement({
    subscription_status: profile?.subscription_status ?? null,
    trial_ends_at: profile?.trial_ends_at ?? null,
  });
  const configured = isStripeConfigured();
  const statusLabel = ent.status ? STATUS_LABELS[ent.status] ?? ent.status : "—";

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your InsureTrack subscription.
        </p>
      </div>

      {searchParams.checkout === "success" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Payment successful — your subscription is being activated.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{PLAN.name}</CardTitle>
            <Badge variant={ent.entitled ? "default" : "destructive"}>
              {statusLabel}
            </Badge>
          </div>
          <CardDescription>
            ${PLAN.priceMonthly}/month after your free trial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ent.trialing && !ent.expired && (
            <p className="text-sm">
              You&apos;re on a free trial —{" "}
              <span className="font-medium">
                {ent.trialDaysLeft} day{ent.trialDaysLeft === 1 ? "" : "s"}
              </span>{" "}
              remaining. Upgrade any time to keep access when it ends.
            </p>
          )}

          {ent.expired && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {ent.status === "canceled"
                  ? "Your subscription was canceled."
                  : "Your free trial has ended."}{" "}
                Upgrade to restore access to your dashboard.
              </span>
            </div>
          )}

          {ent.status === "active" && (
            <p className="text-sm text-muted-foreground">
              Thanks for subscribing! Manage your payment method or cancel any
              time from the billing portal.
            </p>
          )}

          <Separator />

          <div className="space-y-3">
            {ent.status === "active" ? (
              <ManageBillingButton />
            ) : (
              <UpgradeButton
                label={ent.expired ? "Upgrade to restore access" : "Upgrade to Pro"}
              />
            )}

            {!configured && (
              <div className="rounded-md border border-dashed bg-muted/40 p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Stripe isn&apos;t configured (no API keys), so real checkout is
                  disabled. Use these to simulate subscription states and test
                  the paywall:
                </p>
                <SimulateControls status={ent.status} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}