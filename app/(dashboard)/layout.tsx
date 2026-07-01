import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Sidebar } from "@/components/shared/sidebar";
import { UserNav } from "@/components/shared/user-nav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but never render the shell without a user.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
          <div className="flex items-center gap-2 text-primary md:hidden">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-semibold">InsureTrack</span>
          </div>
          <div className="ml-auto">
            <UserNav
              fullName={profile?.full_name ?? null}
              email={user.email ?? ""}
            />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
