"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import type { PolicyStatus, PolicyType } from "@/types/database";
import { deletePolicyRecord } from "@/app/(dashboard)/clients/actions";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  PolicyFormDialog,
  type EditablePolicy,
} from "@/components/clients/policy-form-dialog";

type PolicyRow = {
  id: string;
  policy_type: PolicyType;
  carrier: string | null;
  policy_number: string | null;
  premium: number | null;
  renewal_date: string;
  status: PolicyStatus;
};

const statusVariant: Record<
  PolicyStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  renewed: "secondary",
  lapsed: "destructive",
  cancelled: "outline",
};

export function PolicyList({
  clientId,
  policies,
}: {
  clientId: string;
  policies: PolicyRow[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Policies</h2>
        <PolicyFormDialog
          mode="create"
          clientId={clientId}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add policy
            </Button>
          }
        />
      </div>

      {policies.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          No policies yet. Add the first one.
        </p>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {POLICY_TYPE_LABELS[p.policy_type]}
                  </span>
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.carrier ?? "No carrier"}
                  {p.policy_number ? ` · #${p.policy_number}` : ""} ·{" "}
                  {formatCurrency(p.premium)}/yr
                </p>
                <p className="text-sm">
                  Renews{" "}
                  <span className="font-medium">
                    {formatDate(p.renewal_date)}
                  </span>
                </p>
              </div>
              <div className="flex gap-1">
                <PolicyFormDialog
                  mode="edit"
                  clientId={clientId}
                  policy={p as EditablePolicy}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <ConfirmDialog
                  title="Delete policy?"
                  description={`This permanently removes the ${POLICY_TYPE_LABELS[p.policy_type]} policy. This can't be undone.`}
                  onConfirm={() => deletePolicyRecord(p.id, clientId)}
                  trigger={
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
