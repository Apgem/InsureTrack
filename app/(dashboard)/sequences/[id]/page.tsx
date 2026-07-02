import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Users } from "lucide-react";

import type { Channel, TriggerType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { deleteSequence } from "@/app/(dashboard)/sequences/actions";
import { TRIGGER_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  StepEditor,
  type StepRowData,
} from "@/components/sequences/step-editor";
import { SequenceSettingsDialog } from "@/components/sequences/sequence-settings-dialog";
import { SequenceToggle } from "@/components/sequences/sequence-toggle";
import {
  EnrollDialog,
  type EnrollCandidate,
} from "@/components/sequences/enroll-dialog";
import { UnenrollButton } from "@/components/sequences/unenroll-button";

export default async function SequenceBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [
    { data: sequence },
    { data: steps },
    { data: clients },
    { data: leads },
    { data: enrollments },
  ] = await Promise.all([
    supabase
      .from("sequences")
      .select("id, name, trigger_type, is_active")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("sequence_steps")
      .select("id, step_order, channel, delay_days, subject, body")
      .eq("sequence_id", params.id)
      .order("step_order", { ascending: true }),
    supabase.from("clients").select("id, full_name, email, phone").order("full_name"),
    supabase.from("leads").select("id, full_name, email, phone").order("full_name"),
    supabase
      .from("sequence_enrollments")
      .select("id, client_id, lead_id, status, current_step")
      .eq("sequence_id", params.id)
      .eq("status", "active"),
  ]);

  if (!sequence) notFound();

  const stepRows: StepRowData[] = (steps ?? []).map((s) => ({
    ...s,
    channel: s.channel as Channel,
  }));

  const activeEnrollments = enrollments ?? [];
  const enrolledClientIds = new Set(
    activeEnrollments.map((e) => e.client_id).filter(Boolean) as string[]
  );
  const enrolledLeadIds = new Set(
    activeEnrollments.map((e) => e.lead_id).filter(Boolean) as string[]
  );

  const clientName = new Map((clients ?? []).map((c) => [c.id, c.full_name]));
  const leadName = new Map((leads ?? []).map((l) => [l.id, l.full_name]));

  const candidates: EnrollCandidate[] = [
    ...(clients ?? []).map((c) => ({
      id: c.id,
      name: c.full_name,
      sub: c.email ?? c.phone ?? null,
      type: "client" as const,
      enrolled: enrolledClientIds.has(c.id),
    })),
    ...(leads ?? []).map((l) => ({
      id: l.id,
      name: l.full_name,
      sub: l.email ?? l.phone ?? null,
      type: "lead" as const,
      enrolled: enrolledLeadIds.has(l.id),
    })),
  ];

  const enrolledList = activeEnrollments.map((e) => ({
    id: e.id,
    name: e.client_id
      ? clientName.get(e.client_id) ?? "Client"
      : e.lead_id
        ? leadName.get(e.lead_id) ?? "Lead"
        : "Unknown",
    type: e.client_id ? "client" : "lead",
    step: (e.current_step ?? 0) + 1,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/sequences"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sequences
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
            {sequence.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="neutral">
              {TRIGGER_TYPE_LABELS[sequence.trigger_type as TriggerType]}
            </Badge>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {sequence.is_active ? "Active" : "Off"}
              <SequenceToggle
                id={sequence.id}
                isActive={sequence.is_active ?? false}
              />
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <EnrollDialog sequenceId={sequence.id} candidates={candidates} />
          <SequenceSettingsDialog
            id={sequence.id}
            name={sequence.name}
            triggerType={sequence.trigger_type as TriggerType}
          />
          <ConfirmDialog
            title="Delete sequence?"
            description="This permanently deletes the sequence and all its steps. Active enrollments are removed too."
            successMessage="Sequence deleted"
            onConfirm={deleteSequence.bind(null, sequence.id)}
            redirectTo="/sequences"
            trigger={
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      <p className="rounded-[10px] border border-[#D6E4FA] bg-[#EEF4FF] px-4 py-2.5 text-xs text-[#3B5E91]">
        This sequence auto-enrolls people when its trigger fires
        {sequence.is_active ? "" : " (once you turn it on)"}. You can also
        enroll clients or leads by hand with{" "}
        <span className="font-semibold">Enroll people</span>.
      </p>

      <Card className="rounded-[14px] border-[#E5E5E0]">
        <CardContent className="pt-6">
          <StepEditor sequenceId={sequence.id} steps={stepRows} />
        </CardContent>
      </Card>

      <div className="rounded-[14px] border border-[#E5E5E0] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#3B5E91]" />
          <h2 className="text-sm font-bold text-[#1a1a1a]">
            People in this sequence ({enrolledList.length})
          </h2>
        </div>
        {enrolledList.length === 0 ? (
          <p className="text-sm text-[#9A9A94]">
            No active enrollments. Use “Enroll people” to add clients or leads,
            or wait for the trigger to enroll them automatically.
          </p>
        ) : (
          <div className="divide-y divide-[#F2F2EF]">
            {enrolledList.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1a1a1a]">{e.name}</span>
                  <Badge variant={e.type === "client" ? "new" : "cross"}>
                    {e.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#9A9A94]">
                    on step {e.step}
                  </span>
                  <UnenrollButton enrollmentId={e.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Template variables:{" "}
        <code className="rounded bg-muted px-1">{"{{first_name}}"}</code>{" "}
        <code className="rounded bg-muted px-1">{"{{renewal_date}}"}</code>{" "}
        <code className="rounded bg-muted px-1">{"{{policy_type}}"}</code> ·
        Delays are measured in days after a client is enrolled.
      </p>
    </div>
  );
}