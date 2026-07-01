"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  className,
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={className}
      variant={variant}
      disabled={pending}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
