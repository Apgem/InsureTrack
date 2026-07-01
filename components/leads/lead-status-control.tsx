"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import type { LeadStatus } from "@/types/database";
import { updateLeadStatus } from "@/app/(dashboard)/leads/actions";
import { LEAD_STATUSES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeadStatusControl({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState<LeadStatus>(status);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setValue(status);
  }, [status]);

  function onChange(next: string) {
    const prev = value;
    setValue(next as LeadStatus);
    setError(null);
    startTransition(async () => {
      const res = await updateLeadStatus(leadId, next);
      if (res.error) {
        setValue(prev);
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Select value={value} onValueChange={onChange} disabled={isPending}>
          <SelectTrigger className="w-48">
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
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Move this lead through your pipeline. Marking it won doesn&apos;t create
        a client — use Convert to client for that.
      </p>
    </div>
  );
}
