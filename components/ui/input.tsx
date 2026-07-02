import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[10px] border-[1.5px] border-[#E5E5E0] bg-white px-[14px] text-sm transition-[border-color,box-shadow] duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#9A9A94] focus-visible:border-[#3B5E91] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#EEF4FF] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[#C94040] aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-[#FFF0F0]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
