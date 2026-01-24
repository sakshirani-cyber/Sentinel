import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 
          // Enhanced with teal-tinted shadow for light mode depth
          "bg-primary text-primary-foreground shadow-[0_2px_4px_rgba(15,23,42,0.1),0_4px_8px_rgba(13,148,136,0.15)] hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12),0_8px_20px_rgba(13,148,136,0.2)] dark:hover:shadow-[0_0_20px_rgba(0,255,194,0.3)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover hover:-translate-y-0.5 shadow-[0_2px_4px_rgba(15,23,42,0.1),0_4px_8px_rgba(239,68,68,0.15)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.12),0_8px_16px_rgba(239,68,68,0.2)]",
        outline:
          // Enhanced border and hover with teal accent
          "border-2 border-border bg-background text-foreground hover:bg-primary/5 hover:border-primary hover:text-primary dark:hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(13,148,136,0.1)]",
        secondary:
          // Enhanced with gradient-like appearance and better shadows
          "bg-gradient-to-b from-white to-[#FAFBFC] dark:from-[#1F1F1F] dark:to-[#151515] text-secondary-foreground border border-border hover:border-primary/30 hover:-translate-y-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_4px_rgba(13,148,136,0.04)] hover:shadow-[0_2px_8px_rgba(15,23,42,0.08),0_4px_12px_rgba(13,148,136,0.08)]",
        ghost:
          "text-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15 shadow-none hover:shadow-none",
        link: 
          "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none hover:translate-y-0",
        accent:
          // Enhanced with pink-tinted shadow for light mode
          "bg-accent text-accent-foreground shadow-[0_2px_4px_rgba(15,23,42,0.1),0_4px_8px_rgba(236,72,153,0.15)] hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12),0_8px_20px_rgba(236,72,153,0.2)] dark:hover:shadow-[0_0_20px_rgba(255,92,141,0.3)]",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-2xl px-8 has-[>svg]:px-6 text-base font-semibold",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
