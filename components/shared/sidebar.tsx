"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  Mail,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const mainNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/renewals", label: "Renewals", icon: Calendar },
  { href: "/leads", label: "Leads", icon: TrendingUp },
  { href: "/sequences", label: "Sequences", icon: Mail },
];
const settingsNav = { href: "/settings", label: "Settings", icon: Settings };

function initialsOf(name: string | null) {
  if (!name) return "IN";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "IN";
}

export function Sidebar({
  fullName,
  planLabel = "Free trial",
}: {
  fullName?: string | null;
  planLabel?: string;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLink({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: LucideIcon;
  }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] font-medium transition-colors",
          active
            ? "bg-[#EEF4FF] font-semibold text-[#3B5E91]"
            : "text-[#5a6475] hover:bg-[#F2F2EF] hover:text-[#1a1a1a]"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
        {label}
      </Link>
    );
  }

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[#E5E5E0] bg-white md:flex">
      <div className="flex h-16 items-center px-5">
        <span className="text-[18px] font-bold tracking-tight">
          <span className="text-[#3B5E91]">Insure</span>
          <span className="text-[#C17B8A]">Track</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        <div className="my-2 border-t border-[#E5E5E0]" />
        <NavLink {...settingsNav} />
      </nav>

      <div className="border-t border-[#E5E5E0] p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-xs font-bold text-[#3B5E91]">
            {initialsOf(fullName ?? null)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
              {fullName ?? "Your account"}
            </p>
            <span className="text-[11px] font-semibold text-[#6B9E7A]">
              {planLabel}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}