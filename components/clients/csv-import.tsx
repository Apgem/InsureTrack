"use client";

import * as React from "react";
import Link from "next/link";
import Papa from "papaparse";
import { CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NONE = "__none__";

const FIELDS = [
  { key: "full_name", label: "Full name", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "notes", label: "Notes" },
  { key: "tags", label: "Tags" },
  { key: "policy_type", label: "Policy type" },
  { key: "carrier", label: "Carrier" },
  { key: "policy_number", label: "Policy #" },
  { key: "premium", label: "Premium" },
  { key: "renewal_date", label: "Renewal date" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];
type CsvRow = Record<string, string>;
type ImportSummary = {
  imported: number;
  matched: number;
  skipped: number;
  policiesAdded: number;
  errors: string[];
};

function autoGuess(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const f of FIELDS) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
    const target = norm(f.label);
    const key = norm(f.key);
    const found = headers.find((h) => {
      const nh = norm(h);
      return nh === target || nh === key || nh.includes(key);
    });
    mapping[f.key] = found ?? NONE;
  }
  return mapping;
}

export function CsvImport() {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<CsvRow[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [dragging, setDragging] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function parseFile(file: File) {
    setError(null);
    setSummary(null);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = (res.meta.fields ?? []).filter(Boolean);
        if (!hdrs.length) {
          setError("Couldn't read any columns from that file.");
          return;
        }
        setHeaders(hdrs);
        setRows(res.data);
        setMapping(autoGuess(hdrs));
        setFileName(file.name);
      },
      error: (err) => setError(err.message),
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }

  function applyMapping(): Record<FieldKey, string>[] {
    return rows.map((record) => {
      const out: Record<string, string> = {};
      for (const f of FIELDS) {
        const col = mapping[f.key];
        if (col && col !== NONE && record[col] != null) {
          out[f.key] = record[col];
        }
      }
      return out as Record<FieldKey, string>;
    });
  }

  async function runImport() {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/import/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: applyMapping() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
      } else {
        setSummary(data as ImportSummary);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  const nameMapped = mapping.full_name && mapping.full_name !== NONE;
  const previewRows = applyMapping().slice(0, 5);

  if (summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Import complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1 text-sm">
            <li>
              <span className="font-medium">{summary.imported}</span> new client
              {summary.imported === 1 ? "" : "s"} imported
            </li>
            {summary.matched > 0 && (
              <li>
                <span className="font-medium">{summary.matched}</span> matched
                existing client{summary.matched === 1 ? "" : "s"} (skipped as
                duplicates)
              </li>
            )}
            {summary.policiesAdded > 0 && (
              <li>
                <span className="font-medium">{summary.policiesAdded}</span>{" "}
                policies added
              </li>
            )}
            {summary.skipped > 0 && (
              <li className="text-muted-foreground">
                {summary.skipped} skipped (missing name)
              </li>
            )}
            {summary.errors.length > 0 && (
              <li className="text-destructive">
                {summary.errors.length} row error(s): {summary.errors[0]}
              </li>
            )}
          </ul>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/clients">View clients</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSummary(null);
                setFileName(null);
                setRows([]);
                setHeaders([]);
              }}
            >
              Import another file
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
            Your CSV should have a header row. We&apos;ll match columns next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? "border-primary bg-muted" : "border-muted-foreground/25"
            }`}
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName ?? "Drag & drop a CSV, or click to browse"}
            </span>
            <span className="text-xs text-muted-foreground">
              {rows.length > 0 ? `${rows.length} rows detected` : ".csv files"}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) parseFile(file);
              }}
            />
          </label>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Map columns</CardTitle>
            <CardDescription>
              Match your CSV columns to InsureTrack fields. Full name is
              required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm">
                    {f.label}
                    {"required" in f && f.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </span>
                  <Select
                    value={mapping[f.key] ?? NONE}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [f.key]: v }))
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— none —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!nameMapped && (
              <p className="text-sm text-destructive">
                Map a column to “Full name” to continue.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {nameMapped && previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              First {previewRows.length} of {rows.length} rows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {FIELDS.filter(
                      (f) => mapping[f.key] && mapping[f.key] !== NONE
                    ).map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((r, i) => (
                    <TableRow key={i}>
                      {FIELDS.filter(
                        (f) => mapping[f.key] && mapping[f.key] !== NONE
                      ).map((f) => (
                        <TableCell key={f.key}>{r[f.key] ?? "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button onClick={runImport} disabled={importing}>
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import {rows.length} row{rows.length === 1 ? "" : "s"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
