import * as React from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-[#E5E5E0] bg-white p-16 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FF]">
        <Icon className="text-[#3B5E91]" size={28} strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-[15px] font-bold text-[#1a1a1a]">{title}</h3>
      <p className="mx-auto mb-5 max-w-[240px] text-[13px] leading-relaxed text-[#9A9A94]">
        {description}
      </p>
      {action}
    </div>
  );
}