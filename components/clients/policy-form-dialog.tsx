"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import type { PolicyStatus, PolicyType } from "@/types/database";
import {
  createPolicyRecord,
  updatePolicyRecord,
} from "@/app/(dashboard)/clients/actions";
import { POLICY_STATUSES, POLICY_TYPES } from "@/lib/constants";
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

export type EditablePolicy = {
  id: string;
  policy_type: PolicyType;
  carrier: string | null;
  policy_number: string | null;
  premium: number | null;
  renewal_date: string;
  status: PolicyStatus;
};

type PolicyFormValues = {
  policy_type: PolicyType;
  carrier: string;
  policy_number: string;
  premium: string;
  renewal_date: string;
  status: PolicyStatus;
};

function toFormValues(policy?: EditablePolicy): PolicyFormValues {
  return {
    policy_type: policy?.policy_type ?? "auto",
    carrier: policy?.carrier ?? "",
    policy_number: policy?.policy_number ?? "",
    premium: policy?.premium != null ? String(policy.premium) : "",
    renewal_date: policy?.renewal_date ?? "",
    status: policy?.status ?? "active",
  };
}

export function PolicyFormDialog({
  mode,
  clientId,
  policy,
  trigger,
}: {
  mode: "create" | "edit";
  clientId: string;
  policy?: EditablePolicy;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const { register, handleSubmit, control, reset } = useForm<PolicyFormValues>({
    defaultValues: toFormValues(policy),
  });

  React.useEffect(() => {
    if (open) {
      reset(toFormValues(policy));
      setError(null);
    }
  }, [open, policy, reset]);

  function onSubmit(values: PolicyFormValues) {
    setError(null);
    startTransition(async () => {
      const payload = { client_id: clientId, ...values };
      const res =
        mode === "create"
          ? await createPolicyRecord(payload)
          : await updatePolicyRecord(policy!.id, payload);
      if (res.error) {
        setError(res.error);
      } else {
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
            {mode === "create" ? "Add policy" : "Edit policy"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a policy this client holds."
              : "Update this policy's details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Policy type *</Label>
              <Controller
                control={control}
                name="policy_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLICY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
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
                      {POLICY_STATUSES.map((s) => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                {...register("carrier")}
                placeholder="State Farm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy_number">Policy number</Label>
              <Input id="policy_number" {...register("policy_number")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="premium">Premium ($)</Label>
              <Input
                id="premium"
                type="number"
                step="0.01"
                {...register("premium")}
                placeholder="1200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewal_date">Renewal date *</Label>
              <Input
                id="renewal_date"
                type="date"
                {...register("renewal_date", { required: true })}
              />
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
              {mode === "create" ? "Add policy" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
