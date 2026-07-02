import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Mail, MessageSquare, Workflow } from "lucide-react";

import type { TriggerType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { TRIGGER_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateSequenceDialog } from "@/components/sequences/create-sequence-dialog";
import { SequenceToggle } from "@/components/sequences/sequence-toggle";

export const metadata: Metadata = {
  title: "Sequences · InsureTrack",
};

export default async function SequencesPage() {
  const supabase = createClient();

  const [{ data: sequences }, { data: steps }] = await Promise.all([
    supabase
      .from("sequences")
      .select("id, name, trigger_type, is_active, created_at")
      .order("created_at"),
    supabase.from("sequence_steps").select("sequence_id, channel"),
  ]);

  const stepStats = new Map<string, { email: number; sms: number }>();
  for (const s of steps ?? []) {
    const cur = stepStats.get(s.sequence_id) ?? { email: 0, sms: 0 };
    if (s.channel === "email") cur.email++;
    else cur.sms++;
    stepStats.set(s.sequence_id, cur);
  }

  const list = sequences ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
            Sequences
          </h1>
          <p className="text-sm text-[#5a6475]">
            Automated email &amp; SMS follow-ups. Toggle one on to let it enroll
            and send.
          </p>
        </div>
        <CreateSequenceDialog />
      </div>

      <div className="rounded-[10px] border border-[#D6E4FA] bg-[#EEF4FF] px-4 py-3 text-sm text-[#3B5E91]">
        <span className="font-semibold">How enrollment works:</span> each
        sequence has a <span className="font-semibold">trigger</span> that
        auto-enrolls the right people — e.g. 30/60/90 days before a renewal, or
        when you add a new client or lead. You can also enroll anyone by hand
        from a sequence, or from a client&apos;s or lead&apos;s profile.
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No sequences yet"
          description="Create an automated email or SMS sequence to follow up with clients before renewal."
          action={<CreateSequenceDialog />}
        />
      ) : (
        <div className="space-y-2">
          {list.map((s) => {
            const stats = stepStats.get(s.id) ?? { email: 0, sms: 0 };
            const total = stats.email + stats.sms;
            return (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-[14px] border border-[#E5E5E0] bg-white p-4"
              >
                <div className="flex-1">
                  <Link
                    href={`/sequences/${s.id}`}
                    className="font-medium hover:underline"
                  >
                    {s.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {TRIGGER_TYPE_LABELS[s.trigger_type as TriggerType]}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {stats.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {stats.sms}
                    </span>
                    <span>
                      {total} step{total === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {s.is_active ? "Active" : "Off"}
                  </span>
                  <SequenceToggle id={s.id} isActive={s.is_active ?? false} />
                  <Link href={`/sequences/${s.id}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
