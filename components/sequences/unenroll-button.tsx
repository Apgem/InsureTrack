"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

import { unenroll } from "@/app/(dashboard)/sequences/actions";
import { Button } from "@/components/ui/button";

export function UnenrollButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function remove() {
    startTransition(async () => {
      const res = await unenroll(enrollmentId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Removed from sequence");
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={remove}
      disabled={isPending}
      aria-label="Remove from sequence"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
