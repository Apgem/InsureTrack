"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import type { Channel } from "@/types/database";
import { addStep, updateStep } from "@/app/(dashboard)/sequences/actions";
import { TEMPLATE_VARIABLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EditableStep = {
  id: string;
  channel: Channel;
  delay_days: number | null;
  subject: string | null;
  body: string;
};

type StepFormValues = {
  channel: Channel;
  delay_days: string;
  subject: string;
  body: string;
};

function toValues(step?: EditableStep): StepFormValues {
  return {
    channel: step?.channel ?? "email",
    delay_days: step?.delay_days != null ? String(step.delay_days) : "0",
    subject: step?.subject ?? "",
    body: step?.body ?? "",
  };
}

export function StepFormDialog({
  mode,
  sequenceId,
  step,
  trigger,
}: {
  mode: "create" | "edit";
  sequenceId: string;
  step?: EditableStep;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const { register, handleSubmit, control, reset, watch, setValue } =
    useForm<StepFormValues>({ defaultValues: toValues(step) });

  React.useEffect(() => {
    if (open) {
      reset(toValues(step));
      setError(null);
    }
  }, [open, step, reset]);

  const channel = watch("channel");

  function insertVar(v: string) {
    const current = watch("body");
    setValue("body", current ? `${current} ${v}` : v);
  }

  function onSubmit(values: StepFormValues) {
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await addStep(sequenceId, values)
          : await updateStep(step!.id, sequenceId, values);
      if (res.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add step" : "Edit step"}
          </DialogTitle>
          <DialogDescription>
            Choose a channel, a delay measured in days after enrollment, and the
            message.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Controller
                control={control}
                name="channel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay_days">Delay (days after enrollment)</Label>
              <Input
                id="delay_days"
                type="number"
                min={0}
                {...register("delay_days")}
              />
            </div>
          </div>

          {channel === "email" && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="Your policy renews soon"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" rows={5} {...register("body")} />
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs hover:bg-accent"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Add step" : "Save step"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
