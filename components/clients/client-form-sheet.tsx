"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  createClientRecord,
  updateClientRecord,
} from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type EditableClient = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  tags: string[] | null;
};

type ClientFormValues = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  tags: string;
};

function toFormValues(client?: EditableClient): ClientFormValues {
  return {
    full_name: client?.full_name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
    tags: client?.tags?.join(", ") ?? "",
  };
}

export function ClientFormSheet({
  mode,
  client,
  trigger,
}: {
  mode: "create" | "edit";
  client?: EditableClient;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({ defaultValues: toFormValues(client) });

  React.useEffect(() => {
    if (open) {
      reset(toFormValues(client));
      setError(null);
    }
  }, [open, client, reset]);

  function onSubmit(values: ClientFormValues) {
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createClientRecord(values)
          : await updateClientRecord(client!.id, values);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success(mode === "create" ? "Client added" : "Client updated");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "Add client" : "Edit client"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Add a new contact to your book of business."
              : "Update this client's contact details."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input
              id="full_name"
              {...register("full_name", { required: "Name is required." })}
              placeholder="John Smith"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Main St, Springfield"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="vip, referral (comma-separated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Add client" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
