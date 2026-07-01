import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Pencil, Phone, Trash2 } from "lucide-react";

import type { LeadStatus } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { deleteLead } from "@/app/(dashboard)/leads/actions";
import { LEAD_SOURCE_LABELS, LEAD_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadFormSheet } from "@/components/leads/lead-form-sheet";
import { ConvertLeadButton } from "@/components/leads/convert-lead-button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LeadStatusControl } from "@/components/leads/lead-status-control";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: lead }, { data: enrollments }, { data: messages }] =
    await Promise.all([
      supabase.from("leads").select("*").eq("id", params.id).maybeSingle(),
      supabase
        .from("sequence_enrollments")
        .select("id, sequence_id, status")
        .eq("lead_id", params.id),
      supabase
        .from("messages_log")
        .select("id, channel, subject, body, status, sent_at")
        .eq("lead_id", params.id)
        .order("sent_at", { ascending: false }),
    ]);

  if (!lead) notFound();

  const status = (lead.status ?? "new") as LeadStatus;

  // Resolve sequence names for enrollments.
  const seqIds = Array.from(
    new Set((enrollments ?? []).map((e) => e.sequence_id))
  );
  const seqNames = new Map<string, string>();
  if (seqIds.length) {
    const { data: seqs } = await supabase
      .from("sequences")
      .select("id, name")
      .in("id", seqIds);
    for (const s of seqs ?? []) seqNames.set(s.id, s.name);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {lead.full_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.source ? LEAD_SOURCE_LABELS[lead.source] : "Unknown source"} ·
            Added {formatDate(lead.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status !== "won" && <ConvertLeadButton leadId={lead.id} />}
          <LeadFormSheet
            mode="edit"
            lead={lead}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete lead?"
            description="This permanently removes the lead. This can't be undone."
            onConfirm={deleteLead.bind(null, lead.id)}
            redirectTo="/leads"
            trigger={
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      {/* Pipeline stage flow */}
      <div className="flex flex-wrap items-center gap-2">
        {LEAD_STATUSES.map((s) => (
          <span
            key={s.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              s.value === status
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 text-muted-foreground"
            )}
          >
            {s.label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusControl leadId={lead.id} status={status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message history</CardTitle>
            </CardHeader>
            <CardContent>
              {messages && messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{m.channel}</Badge>
                        <span className="text-muted-foreground">
                          {formatDate(m.sent_at)}
                        </span>
                      </div>
                      {m.subject && (
                        <p className="mt-1 font-medium">{m.subject}</p>
                      )}
                      <p className="text-muted-foreground">{m.body}</p>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No messages sent yet. New-lead automation lands here once the
                  daily send runs.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {lead.email ?? (
                  <span className="text-muted-foreground">No email</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {lead.phone ?? (
                  <span className="text-muted-foreground">No phone</span>
                )}
              </div>
              {lead.interested_in && lead.interested_in.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-muted-foreground">Interested in</p>
                    <div className="flex flex-wrap gap-1">
                      {lead.interested_in.map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {lead.notes && (
                <>
                  <Separator />
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {lead.notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sequence enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments && enrollments.length > 0 ? (
                <div className="space-y-2">
                  {enrollments.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{seqNames.get(e.sequence_id) ?? "Sequence"}</span>
                      <Badge variant="secondary">{e.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not enrolled in any sequences yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
