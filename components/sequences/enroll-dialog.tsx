"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, UserPlus } from "lucide-react";

import {
  enrollInSequence,
  type EnrollTarget,
} from "@/app/(dashboard)/sequences/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EnrollCandidate = {
  id: string;
  name: string;
  sub: string | null;
  type: "client" | "lead";
  enrolled: boolean;
};

export function EnrollDialog({
  sequenceId,
  candidates,
}: {
  sequenceId: string;
  candidates: EnrollCandidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setSelected(new Set());
      setQuery("");
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      `${c.name} ${c.sub ?? ""}`.toLowerCase().includes(q)
    );
  }, [candidates, query]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function submit() {
    const targets: EnrollTarget[] = candidates
      .filter((c) => selected.has(`${c.type}:${c.id}`))
      .map((c) =>
        c.type === "client" ? { clientId: c.id } : { leadId: c.id }
      );
    if (!targets.length) return;
    startTransition(async () => {
      const res = await enrollInSequence(sequenceId, targets);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Enrolled ${res.enrolled}${
          res.skipped ? ` · ${res.skipped} already in` : ""
        }`
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Enroll people
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enroll people in this sequence</DialogTitle>
          <DialogDescription>
            Pick clients or leads to add. They&apos;ll start receiving the
            sequence&apos;s steps on the next daily send.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9A94]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients and leads…"
            className="pl-9"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#9A9A94]">
              {candidates.length === 0
                ? "No clients or leads to enroll yet."
                : "No matches."}
            </p>
          ) : (
            filtered.map((c) => {
              const key = `${c.type}:${c.id}`;
              const checked = selected.has(key);
              return (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-[8px] border px-3 py-2 transition-colors ${
                    c.enrolled
                      ? "cursor-not-allowed border-[#F2F2EF] opacity-60"
                      : checked
                        ? "border-[#3B5E91] bg-[#EEF4FF]"
                        : "border-[#E5E5E0] hover:bg-[#FAFAF8]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#3B5E91]"
                    disabled={c.enrolled}
                    checked={checked}
                    onChange={() => toggle(key)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1a1a1a]">
                      {c.name}
                    </p>
                    {c.sub && (
                      <p className="truncate text-xs text-[#9A9A94]">{c.sub}</p>
                    )}
                  </div>
                  <Badge variant={c.type === "client" ? "new" : "cross"}>
                    {c.type}
                  </Badge>
                  {c.enrolled && <Badge variant="neutral">In sequence</Badge>}
                </label>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={isPending || selected.size === 0}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enroll {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
