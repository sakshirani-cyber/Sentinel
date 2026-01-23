"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent",
        "transition-all duration-200 outline-none",
        "data-[state=unchecked]:bg-muted",
        "data-[state=checked]:bg-primary",
        "dark:data-[state=unchecked]:bg-muted",
        "dark:data-[state=checked]:bg-primary dark:data-[state=checked]:shadow-[0_0_10px_rgba(0,255,194,0.4)]",
        "focus-visible:ring-[3px] focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "switch-thumb pointer-events-none block size-5 rounded-full shadow-md ring-0",
          "bg-white dark:bg-white",
          "transition-transform duration-200",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
