"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";

import type { TriggerType } from "@/types/database";
import { createSequence } from "@/app/(dashboard)/sequences/actions";
import { TRIGGER_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type FormValues = { name: string; trigger_type: TriggerType };

export function CreateSequenceDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const { register, handleSubmit, control, reset } = useForm<FormValues>({
    defaultValues: { name: "", trigger_type: "renewal_90" },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      const res = await createSequence(values);
      if (res.error) setError(res.error);
      else if (res.id) {
        setOpen(false);
        reset();
        router.push(`/sequences/${res.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create sequence
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create sequence</DialogTitle>
          <DialogDescription>
            Name it and pick what triggers enrollment. You&apos;ll add steps
            next.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sequence name</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="90-day renewal email"
            />
          </div>
          <div className="space-y-2">
            <Label>Trigger</Label>
            <Controller
              control={control}
              name="trigger_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create &amp; add steps
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
