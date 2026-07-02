import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#EEF4FF] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary brand action
        default:
          "bg-[#3B5E91] text-white hover:bg-[#2d4a73] hover:-translate-y-px",
        // Neutral bordered (the workhorse secondary action: Edit, Cancel, etc.)
        outline:
          "bg-white text-[#5a6475] border-[1.5px] border-[#E5E5E0] hover:bg-[#F2F2EF] hover:border-[#9A9A94]",
        // Blue-outlined secondary
        secondary:
          "bg-white text-[#3B5E91] border-[1.5px] border-[#3B5E91] hover:bg-[#EEF4FF]",
        // True ghost (no border) — icon buttons, subtle actions
        ghost: "bg-transparent text-[#5a6475] hover:bg-[#F2F2EF]",
        destructive:
          "bg-[#FFF0F0] text-[#C94040] border-[1.5px] border-[#F5BEBE] hover:bg-[#FFE0E0]",
        rose: "bg-[#C17B8A] text-white hover:bg-[#9A4F60] hover:-translate-y-px",
        link: "text-[#3B5E91] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
