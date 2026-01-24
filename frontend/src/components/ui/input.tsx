import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-border px-4 py-2",
        "text-base bg-input-background text-foreground",
        // Subtle inner shadow for depth
        "shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]",
        "placeholder:text-muted-foreground",
        "selection:bg-primary/20 selection:text-foreground",
        "dark:bg-input dark:border-border dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
        "transition-all duration-200 outline-none",
        "hover:border-foreground-muted hover:shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(13,148,136,0.05)]",
        // Enhanced focus with teal glow for light mode
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring",
        "focus-visible:shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_0_12px_rgba(13,148,136,0.12)]",
        "dark:focus-visible:ring-primary/40 dark:focus-visible:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_0_15px_rgba(0,255,194,0.15)]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
