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
        "placeholder:text-muted-foreground",
        "selection:bg-primary/20 selection:text-foreground",
        "dark:bg-input dark:border-border",
        "transition-all duration-200 outline-none",
        "hover:border-foreground-muted",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring",
        "dark:focus-visible:ring-primary/40 dark:focus-visible:shadow-[0_0_15px_rgba(0,255,194,0.15)]",
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
