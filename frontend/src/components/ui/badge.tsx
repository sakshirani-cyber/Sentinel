import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm [a&]:hover:bg-primary-hover dark:[a&]:hover:shadow-[0_0_10px_rgba(0,255,194,0.3)]",
        secondary:
          "border-border bg-secondary text-secondary-foreground [a&]:hover:bg-secondary-hover",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm [a&]:hover:bg-destructive-hover",
        outline:
          "border-border text-foreground [a&]:hover:bg-primary/10 [a&]:hover:text-primary [a&]:hover:border-primary/30",
        accent:
          "border-transparent bg-accent text-accent-foreground shadow-sm [a&]:hover:bg-accent-hover dark:[a&]:hover:shadow-[0_0_10px_rgba(255,92,141,0.3)]",
        success:
          "border-transparent bg-success/15 text-success dark:bg-success/20",
        warning:
          "border-transparent bg-warning/15 text-warning dark:bg-warning/20",
        info:
          "border-transparent bg-info/15 text-info dark:bg-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
