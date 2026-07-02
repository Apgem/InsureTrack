import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // InsureTrack status variants
        urgent: "bg-[#FFF0F0] text-[#C94040] border border-[#F5BEBE]",
        soon: "bg-[#FFF8E6] text-[#B87A1A] border border-[#F5D78E]",
        ok: "bg-[#F0FBF4] text-[#4A7A57] border border-[#B8E0C4]",
        new: "bg-[#EEF4FF] text-[#3B5E91] border border-[#D6E4FA]",
        cross: "bg-[#FFF0F3] text-[#9A4F60] border border-[#F5C4D0]",
        neutral: "bg-[#F2F2EF] text-[#5a6475] border border-[#E5E5E0]",
        // Back-compat aliases (existing callers use these names)
        default: "bg-[#EEF4FF] text-[#3B5E91] border border-[#D6E4FA]",
        secondary: "bg-[#F2F2EF] text-[#5a6475] border border-[#E5E5E0]",
        destructive: "bg-[#FFF0F0] text-[#C94040] border border-[#F5BEBE]",
        outline: "border border-[#E5E5E0] text-[#5a6475]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a leading status dot in the current text color. */
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };