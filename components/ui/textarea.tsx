import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[10px] border-[1.5px] border-[#E5E5E0] bg-white px-[14px] py-2.5 text-sm transition-[border-color,box-shadow] duration-150 placeholder:text-[#9A9A94] focus-visible:border-[#3B5E91] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#EEF4FF] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[#C94040] aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-[#FFF0F0]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
