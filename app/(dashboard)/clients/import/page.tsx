import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CsvImport } from "@/components/clients/csv-import";

export const metadata: Metadata = {
  title: "Import clients · InsureTrack",
};

export default function ImportClientsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import clients</h1>
        <p className="text-sm text-muted-foreground">
          Bulk-add clients from a CSV. Duplicates are matched by email, then
          phone.
        </p>
      </div>
      <CsvImport />
    </div>
  );
}
