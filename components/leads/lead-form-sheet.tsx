"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { LeadSource, LeadStatus } from "@/types/database";
import {
  createLead,
  updateLead,
} from "@/app/(dashboard)/leads/actions";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type EditableLead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource | null;
  status: LeadStatus | null;
  notes: string | null;
  interested_in: string[] | null;
};

type LeadFormValues = {
  full_name: string;
  email: string;
  phone: string;
  source: LeadSource | "";
  status: LeadStatus;
  notes: string;
  interested_in: string;
};

function toFormValues(lead?: EditableLead): LeadFormValues {
  return {
    full_name: lead?.full_name ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    source: lead?.source ?? "",
    status: lead?.status ?? "new",
    notes: lead?.notes ?? "",
    interested_in: lead?.interested_in?.join(", ") ?? "",
  };
}

export function LeadFormSheet({
  mode,
  lead,
  trigger,
}: {
  mode: "create" | "edit";
  lead?: EditableLead;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({ defaultValues: toFormValues(lead) });

  React.useEffect(() => {
    if (open) {
      reset(toFormValues(lead));
      setError(null);
    }
  }, [open, lead, reset]);

  function onSubmit(values: LeadFormValues) {
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createLead(values)
          : await updateLead(lead!.id, values);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success(mode === "create" ? "Lead added" : "Lead updated");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add lead" : "Edit lead"}</SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Add a new prospect to your pipeline."
              : "Update this lead's details."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input
              id="full_name"
              {...register("full_name", { required: "Name is required." })}
              placeholder="Jane Doe"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Source</Label>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Where from?" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interested_in">Interested in</Label>
            <Input
              id="interested_in"
              {...register("interested_in")}
              placeholder="auto, home (comma-separated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Add lead" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
