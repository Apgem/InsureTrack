"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";

import { convertLeadToClient } from "@/app/(dashboard)/leads/actions";
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

export function ConvertLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleConvert() {
    setError(null);
    startTransition(async () => {
      const res = await convertLeadToClient(leadId);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success("Lead converted to client");
        setOpen(false);
        router.push(res.id ? `/clients/${res.id}` : "/clients");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserCheck className="h-4 w-4" />
          Convert to client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to client?</DialogTitle>
          <DialogDescription>
            This creates a client record from this lead and marks the lead as
            won. The new client&apos;s welcome sequence runs on the next daily
            send.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConvert} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
