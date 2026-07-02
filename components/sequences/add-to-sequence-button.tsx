"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { enrollInSequence } from "@/app/(dashboard)/sequences/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type EnrollableSequence = { id: string; name: string; trigger: string };

export function AddToSequenceButton({
  clientId,
  leadId,
  sequences,
}: {
  clientId?: string;
  leadId?: string;
  /** Active sequences this contact is NOT already enrolled in. */
  sequences: EnrollableSequence[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [choice, setChoice] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) setChoice(null);
  }, [open]);

  function submit() {
    if (!choice) return;
    startTransition(async () => {
      const res = await enrollInSequence(choice, [
        clientId ? { clientId } : { leadId },
      ]);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.enrolled ? "Added to sequence" : "Already in that sequence"
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Add to sequence
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to a sequence</DialogTitle>
          <DialogDescription>
            Manually enroll this contact. Steps send on the next daily run.
          </DialogDescription>
        </DialogHeader>

        {sequences.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#9A9A94]">
            No active sequences available. Create one (and turn it on) first,
            or this contact is already in all of them.
          </p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {sequences.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center gap-3 rounded-[8px] border px-3 py-2 transition-colors ${
                  choice === s.id
                    ? "border-[#3B5E91] bg-[#EEF4FF]"
                    : "border-[#E5E5E0] hover:bg-[#FAFAF8]"
                }`}
              >
                <input
                  type="radio"
                  name="sequence"
                  className="h-4 w-4 accent-[#3B5E91]"
                  checked={choice === s.id}
                  onChange={() => setChoice(s.id)}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1a1a1a]">
                    {s.name}
                  </p>
                  <p className="truncate text-xs text-[#9A9A94]">{s.trigger}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !choice}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add to sequence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
