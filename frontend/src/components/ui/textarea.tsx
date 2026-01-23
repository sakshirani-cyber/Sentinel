import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-border",
        "bg-input-background px-4 py-3 text-base text-foreground",
        "placeholder:text-muted-foreground",
        "resize-none",
        "transition-all duration-200 outline-none",
        "hover:border-foreground-muted",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring",
        "dark:bg-input dark:focus-visible:ring-primary/40 dark:focus-visible:shadow-[0_0_15px_rgba(0,255,194,0.15)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
