import { ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex items-center gap-2 text-primary">
        <ShieldCheck className="h-7 w-7" />
        <span className="text-2xl font-semibold tracking-tight">
          InsureTrack
        </span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Renewal automation &amp; client retention for independent agents.
      </p>
    </div>
  );
}
