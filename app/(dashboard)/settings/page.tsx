import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = {
  title: "Settings · InsureTrack",
};

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, agency_name, phone, timezone")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and agency details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile &amp; agency</CardTitle>
          <CardDescription>
            This name and agency appear on your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            profile={{
              full_name: profile?.full_name ?? null,
              agency_name: profile?.agency_name ?? null,
              phone: profile?.phone ?? null,
              timezone: profile?.timezone ?? null,
              email: user.email ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Billing</CardTitle>
          <CardDescription>
            Manage your subscription and payment method.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/settings/billing">
              <CreditCard className="h-4 w-4" />
              Go to billing
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}