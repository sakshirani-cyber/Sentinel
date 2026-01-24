import * as React from "react";

import { cn } from "./utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // "Pond Reflection" effect - Organic gradient with layered depth
        "bg-gradient-to-b from-white via-[#F7F9F7] to-[#EEF7F2]",
        "text-card-foreground flex flex-col gap-6 rounded-2xl",
        // Organic border with subtle teal undertone
        "border border-[#C8D4D8]/60 border-t-white/80",
        // Multi-layer pond shadow with organic teal tint
        "shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(200,212,216,0.3),0_1px_2px_rgba(15,23,42,0.04),0_4px_8px_rgba(10,143,129,0.06),0_12px_24px_rgba(15,23,42,0.05)]",
        "backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        // Enhanced hover with stronger depth and border accent
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_8px_rgba(15,23,42,0.06),0_8px_16px_rgba(10,143,129,0.1),0_16px_32px_rgba(15,23,42,0.06),0_0_0_1px_rgba(10,143,129,0.12)]",
        "hover:-translate-y-1 hover:border-primary/40",
        "relative overflow-hidden",
        // Top edge highlight for 3D glass effect
        "after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/95 after:to-transparent after:pointer-events-none",
        // Water reflection shimmer with firefly hint
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-[rgba(199,244,100,0.03)] before:pointer-events-none before:opacity-60",
        // Dark mode - "Bioluminescent" effect
        "dark:bg-gradient-to-b dark:from-[#0F1214] dark:via-[#0C0E10] dark:to-[#080A0C]",
        "dark:border-[#262B30]/60 dark:border-t-white/5",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_4px_12px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.2)]",
        "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.3),0_0_30px_rgba(0,245,184,0.08)]",
        "dark:after:via-[rgba(0,245,184,0.08)]",
        "dark:before:from-[rgba(0,245,184,0.03)] dark:before:to-[rgba(159,211,86,0.02)] dark:before:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 relative z-10",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none font-semibold text-foreground tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6 relative z-10", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6 relative z-10 gap-3", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
