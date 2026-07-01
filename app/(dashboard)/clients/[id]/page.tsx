import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Lightbulb,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";

import type { PolicyStatus, PolicyType } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { deleteClientRecord } from "@/app/(dashboard)/clients/actions";
import { POLICY_TYPE_LABELS } from "@/lib/constants";
import { getCrossSellSuggestions } from "@/lib/cross-sell";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClientFormSheet } from "@/components/clients/client-form-sheet";
import { PolicyList } from "@/components/clients/policy-list";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: client }, { data: policies }, { data: enrollments }, { data: messages }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .maybeSingle(),
      supabase
        .from("policies")
        .select(
          "id, policy_type, carrier, policy_number, premium, renewal_date, status"
        )
        .eq("client_id", params.id)
        .order("renewal_date"),
      supabase
        .from("sequence_enrollments")
        .select("id, sequence_id, status, current_step, enrolled_at")
        .eq("client_id", params.id),
      supabase
        .from("messages_log")
        .select("id, channel, subject, body, status, sent_at")
        .eq("client_id", params.id)
        .order("sent_at", { ascending: false }),
    ]);

  if (!client) notFound();

  const policyRows = (policies ?? []).map((p) => ({
    ...p,
    policy_type: p.policy_type as PolicyType,
    status: (p.status ?? "active") as PolicyStatus,
  }));

  const activeTypes = policyRows
    .filter((p) => p.status === "active")
    .map((p) => p.policy_type);
  const crossSell = getCrossSellSuggestions(activeTypes);

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
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {client.full_name}
          </h1>
          {client.tags && client.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {client.tags.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <ClientFormSheet
            mode="edit"
            client={client}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete client?"
            description="This permanently removes the client and all their policies. This can't be undone."
            onConfirm={deleteClientRecord.bind(null, client.id)}
            redirectTo="/clients"
            trigger={
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      {crossSell.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Cross-sell opportunity: </span>
            This client holds{" "}
            {activeTypes.map((t) => POLICY_TYPE_LABELS[t]).join(", ")} but no{" "}
            {crossSell.map((t) => POLICY_TYPE_LABELS[t]).join(" or ")}. Consider
            a cross-sell.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <PolicyList clientId={client.id} policies={policyRows} />
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
                  No messages sent yet. Automated emails and SMS land here once
                  sequences run (Phase 4).
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
                {client.email ?? <span className="text-muted-foreground">No email</span>}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {client.phone ?? <span className="text-muted-foreground">No phone</span>}
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                {client.address ?? (
                  <span className="text-muted-foreground">No address</span>
                )}
              </div>
              {client.notes && (
                <>
                  <Separator />
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {client.notes}
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
