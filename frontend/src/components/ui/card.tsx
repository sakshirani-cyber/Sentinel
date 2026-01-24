import * as React from "react";

import { cn } from "./utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Base card with gradient background for depth
        "bg-gradient-to-b from-white to-[#FAFBFC] text-card-foreground flex flex-col gap-6 rounded-2xl border border-border",
        // Enhanced shadow with teal tint for visual depth
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_2px_4px_rgba(13,148,136,0.04),0_4px_8px_rgba(15,23,42,0.04),0_8px_16px_rgba(13,148,136,0.03)]",
        "backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        // Enhanced hover with stronger shadow and border accent
        "hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_8px_16px_rgba(13,148,136,0.08),0_16px_32px_rgba(15,23,42,0.06),0_0_0_1px_rgba(13,148,136,0.1)]",
        "hover:-translate-y-1 hover:border-primary/40",
        // Dark mode hover
        "dark:bg-gradient-to-b dark:from-[#151515] dark:to-[#0f0f0f]",
        "dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_20px_rgba(0,255,194,0.1)]",
        "relative overflow-hidden",
        // Top edge highlight for 3D glass effect
        "after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/90 after:to-transparent after:pointer-events-none",
        "dark:after:via-white/10",
        // Shine reflection effect
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:via-transparent before:to-transparent before:pointer-events-none before:opacity-60",
        "dark:before:from-white/5 dark:before:opacity-100",
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
