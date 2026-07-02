"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleSequence } from "@/app/(dashboard)/sequences/actions";
import { Switch } from "@/components/ui/switch";

export function SequenceToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = React.useState(isActive);
  const [isPending, startTransition] = React.useTransition();

  function onChange(value: boolean) {
    setChecked(value);
    startTransition(async () => {
      const res = await toggleSequence(id, value);
      if (res.error) {
        setChecked(!value); // revert on failure
        toast.error(res.error);
      } else {
        toast.success(value ? "Sequence activated" : "Sequence paused");
        router.refresh();
      }
    });
  }

  return (
    <Switch checked={checked} onCheckedChange={onChange} disabled={isPending} />
  );
}
