import { redirect } from "next/navigation";

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
    <div className="flex min-h-screen bg-[#FAFAF8]">
      <Sidebar fullName={profile?.full_name ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E5E0] bg-white px-4 sm:px-6">
          <div className="md:hidden">
            <span className="text-[17px] font-bold tracking-tight">
              <span className="text-[#3B5E91]">Insure</span>
              <span className="text-[#C17B8A]">Track</span>
            </span>
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
