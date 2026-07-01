import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

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

export default async function SequenceBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: sequence }, { data: steps }] = await Promise.all([
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
  ]);

  if (!sequence) notFound();

  const stepRows: StepRowData[] = (steps ?? []).map((s) => ({
    ...s,
    channel: s.channel as Channel,
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
          <h1 className="text-2xl font-semibold tracking-tight">
            {sequence.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">
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
        <div className="flex gap-2">
          <SequenceSettingsDialog
            id={sequence.id}
            name={sequence.name}
            triggerType={sequence.trigger_type as TriggerType}
          />
          <ConfirmDialog
            title="Delete sequence?"
            description="This permanently deletes the sequence and all its steps. Active enrollments are removed too."
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

      <Card>
        <CardContent className="pt-6">
          <StepEditor sequenceId={sequence.id} steps={stepRows} />
        </CardContent>
      </Card>

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
