"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import type { Channel } from "@/types/database";
import {
  deleteStep,
  moveStep,
  testSendStep,
} from "@/app/(dashboard)/sequences/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  StepFormDialog,
  type EditableStep,
} from "@/components/sequences/step-form-dialog";

export type StepRowData = {
  id: string;
  step_order: number;
  channel: Channel;
  delay_days: number | null;
  subject: string | null;
  body: string;
};

function StepRow({
  sequenceId,
  step,
  index,
  total,
}: {
  sequenceId: string;
  step: StepRowData;
  index: number;
  total: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveStep(step.id, sequenceId, direction);
      router.refresh();
    });
  }

  function test() {
    setFeedback(null);
    setError(null);
    startTransition(async () => {
      const res = await testSendStep(step.id);
      if (res.error) setError(res.error);
      else setFeedback(res.message ?? "Sent.");
    });
  }

  const Icon = step.channel === "email" ? Mail : MessageSquare;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === 0 || isPending}
            onClick={() => move("up")}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={index === total - 1 || isPending}
            onClick={() => move("down")}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Icon className="h-3 w-3" />
              {step.channel === "email" ? "Email" : "SMS"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Day {step.delay_days ?? 0} after enrollment
            </span>
          </div>
          {step.subject && (
            <p className="mt-2 text-sm font-medium">{step.subject}</p>
          )}
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {step.body}
          </p>
          {feedback && (
            <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              {feedback}
            </p>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={test}
            disabled={isPending}
            title="Send test to yourself"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <StepFormDialog
            mode="edit"
            sequenceId={sequenceId}
            step={step as EditableStep}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete step?"
            description="This removes the step from the sequence."
            onConfirm={() => deleteStep(step.id, sequenceId)}
            trigger={
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}

export function StepEditor({
  sequenceId,
  steps,
}: {
  sequenceId: string;
  steps: StepRowData[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Steps</h2>
        <StepFormDialog
          mode="create"
          sequenceId={sequenceId}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add step
            </Button>
          }
        />
      </div>

      {steps.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No steps yet. Add the first message in this sequence.
        </p>
      ) : (
        <div className="space-y-2">
          {steps.map((s, i) => (
            <StepRow
              key={s.id}
              sequenceId={sequenceId}
              step={s}
              index={i}
              total={steps.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
