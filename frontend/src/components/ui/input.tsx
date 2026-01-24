import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // "Marsh Well" effect - recessed organic feel
        "flex h-11 w-full min-w-0 rounded-xl px-4 py-2",
        // Gradient background for organic depth
        "bg-gradient-to-b from-[#F7F9F7] to-white",
        // Border with teal undertone
        "border border-[#C8D4D8]",
        "text-base text-foreground",
        // Inset shadow for recessed well effect
        "shadow-[inset_0_2px_4px_rgba(15,23,42,0.03),inset_0_0_0_1px_rgba(200,212,216,0.3)]",
        "placeholder:text-muted-foreground",
        "selection:bg-primary/20 selection:text-foreground",
        "transition-all duration-200 outline-none",
        // Hover - subtle lift
        "hover:border-[#A8B8C0]",
        "hover:shadow-[inset_0_2px_4px_rgba(15,23,42,0.03),0_0_0_1px_rgba(10,143,129,0.06)]",
        // Focus - organic teal glow with smooth transition
        "focus-visible:bg-white",
        "focus-visible:border-primary",
        "focus-visible:ring-[3px] focus-visible:ring-ring",
        "focus-visible:shadow-[inset_0_1px_2px_rgba(15,23,42,0.03),0_0_0_3px_rgba(10,143,129,0.12),0_0_12px_rgba(10,143,129,0.08)]",
        // Dark mode - "Deep Water Well" effect
        "dark:bg-gradient-to-b dark:from-[#0C0E10] dark:to-[#0F1214]",
        "dark:border-[#262B30]",
        "dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]",
        "dark:hover:border-[#3A4048]",
        "dark:focus-visible:bg-[#0F1214]",
        "dark:focus-visible:ring-primary/35",
        "dark:focus-visible:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_0_0_3px_rgba(0,245,184,0.15),0_0_15px_rgba(0,245,184,0.1)]",
        // File input styling
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // States
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
