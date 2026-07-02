import type { Metadata } from "next";
import { Plus, TrendingUp } from "lucide-react";

import type { LeadStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LeadFormSheet } from "@/components/leads/lead-form-sheet";
import { LeadsBoard, type LeadCard } from "@/components/leads/leads-board";

export const metadata: Metadata = {
  title: "Leads · InsureTrack",
};

export default async function LeadsPage() {
  const supabase = createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, source, status, interested_in, created_at"
    )
    .order("created_at", { ascending: false });

  const cards: LeadCard[] = (leads ?? []).map((l) => ({
    id: l.id,
    full_name: l.full_name,
    email: l.email,
    phone: l.phone,
    source: l.source,
    status: (l.status ?? "new") as LeadStatus,
    interested_in: l.interested_in,
    created_at: l.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Your prospect pipeline. Drag cards to update their stage.
          </p>
        </div>
        <LeadFormSheet
          mode="create"
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Add lead
            </Button>
          }
        />
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No leads yet"
          description="Add your first prospect to start tracking them through your pipeline."
          action={
            <LeadFormSheet
              mode="create"
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Add a lead
                </Button>
              }
            />
          }
        />
      ) : (
        <LeadsBoard leads={cards} />
      )}
    </div>
  );
}
