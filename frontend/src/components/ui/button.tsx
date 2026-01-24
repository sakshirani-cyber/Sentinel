import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 
          // "Frog Leap" effect - 3D gradient with depth edge
          [
            "bg-gradient-to-b from-[#0A9A8A] to-[#087D6F] text-primary-foreground",
            "shadow-[0_2px_0_#065F56,0_4px_12px_rgba(10,143,129,0.25)]",
            "hover:from-[#0B8D7E] hover:to-[#076F63]",
            "hover:-translate-y-0.5",
            "hover:shadow-[0_3px_0_#065F56,0_6px_20px_rgba(10,143,129,0.35)]",
            "active:translate-y-0 active:shadow-[0_1px_0_#065F56,0_2px_8px_rgba(10,143,129,0.2)]",
            // Dark mode - Bioluminescent glow
            "dark:from-[#00F5B8] dark:to-[#00D9A0] dark:text-[#080A0C]",
            "dark:shadow-[0_2px_0_#00B385,0_4px_12px_rgba(0,245,184,0.25)]",
            "dark:hover:shadow-[0_3px_0_#00B385,0_6px_20px_rgba(0,245,184,0.4),0_0_30px_rgba(0,245,184,0.2)]",
            "dark:active:shadow-[0_1px_0_#00B385,0_2px_8px_rgba(0,245,184,0.2)]",
          ].join(" "),
        destructive:
          [
            "bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-destructive-foreground",
            "shadow-[0_2px_0_#B91C1C,0_4px_12px_rgba(239,68,68,0.25)]",
            "hover:from-[#DC2626] hover:to-[#B91C1C]",
            "hover:-translate-y-0.5",
            "hover:shadow-[0_3px_0_#B91C1C,0_6px_20px_rgba(239,68,68,0.35)]",
            "active:translate-y-0 active:shadow-[0_1px_0_#B91C1C,0_2px_8px_rgba(239,68,68,0.2)]",
            "dark:from-[#F87171] dark:to-[#EF4444]",
            "dark:shadow-[0_2px_0_#DC2626,0_4px_12px_rgba(248,113,113,0.25)]",
          ].join(" "),
        outline:
          // Enhanced border with organic teal accent
          [
            "border-2 border-[#C8D4D8] bg-background text-foreground",
            "hover:bg-[#EEF7F2] hover:border-primary hover:text-primary",
            "hover:-translate-y-0.5",
            "hover:shadow-[0_2px_8px_rgba(10,143,129,0.12)]",
            "active:translate-y-0",
            "dark:border-[#262B30] dark:hover:bg-primary/10",
            "dark:hover:shadow-[0_0_15px_rgba(0,245,184,0.15)]",
          ].join(" "),
        secondary:
          // "Ripple" effect - Organic gradient with soft depth
          [
            "bg-gradient-to-b from-white to-[#F7F9F7] text-secondary-foreground",
            "border border-[#C8D4D8]",
            "shadow-[inset_0_1px_0_white,0_1px_3px_rgba(15,23,42,0.08)]",
            "hover:border-primary/40 hover:-translate-y-0.5",
            "hover:shadow-[inset_0_1px_0_white,0_2px_8px_rgba(10,143,129,0.12)]",
            "hover:from-[#F7F9F7] hover:to-[#EEF7F2]",
            "active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
            // Dark mode
            "dark:from-[#1A1E22] dark:to-[#0F1214] dark:border-[#262B30]",
            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_1px_3px_rgba(0,0,0,0.3)]",
            "dark:hover:border-primary/30",
            "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,245,184,0.1)]",
          ].join(" "),
        ghost:
          [
            "text-foreground hover:bg-primary/8 hover:text-primary",
            "shadow-none hover:shadow-none",
            "dark:hover:bg-primary/12",
          ].join(" "),
        link: 
          "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none hover:translate-y-0",
        accent:
          // "Orchid Bloom" effect - Pink gradient with warm glow
          [
            "bg-gradient-to-b from-[#E85A98] to-[#C93D7A] text-accent-foreground",
            "shadow-[0_2px_0_#A8336A,0_4px_12px_rgba(224,71,140,0.25)]",
            "hover:from-[#E0478C] hover:to-[#B8356E]",
            "hover:-translate-y-0.5",
            "hover:shadow-[0_3px_0_#A8336A,0_6px_20px_rgba(224,71,140,0.35)]",
            "active:translate-y-0 active:shadow-[0_1px_0_#A8336A,0_2px_8px_rgba(224,71,140,0.2)]",
            // Dark mode - Coral glow
            "dark:from-[#FF8BA6] dark:to-[#FF6B8A] dark:text-[#080A0C]",
            "dark:shadow-[0_2px_0_#E55A7A,0_4px_12px_rgba(255,107,138,0.25)]",
            "dark:hover:shadow-[0_3px_0_#E55A7A,0_6px_20px_rgba(255,107,138,0.4),0_0_25px_rgba(255,107,138,0.2)]",
          ].join(" "),
        // New: Firefly accent button
        firefly:
          [
            "bg-gradient-to-b from-[#D4F97A] to-[#C7F464] text-[#1A2E10]",
            "shadow-[0_2px_0_#9FD356,0_4px_12px_rgba(199,244,100,0.3)]",
            "hover:-translate-y-0.5",
            "hover:shadow-[0_3px_0_#9FD356,0_6px_20px_rgba(199,244,100,0.45)]",
            "active:translate-y-0 active:shadow-[0_1px_0_#9FD356,0_2px_8px_rgba(199,244,100,0.25)]",
            "dark:shadow-[0_2px_0_#88B84A,0_4px_12px_rgba(159,211,86,0.3),0_0_20px_rgba(199,244,100,0.15)]",
            "dark:hover:shadow-[0_3px_0_#88B84A,0_6px_20px_rgba(159,211,86,0.5),0_0_35px_rgba(199,244,100,0.25)]",
          ].join(" "),
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
