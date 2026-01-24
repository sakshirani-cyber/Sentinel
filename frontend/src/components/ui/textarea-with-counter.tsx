import * as React from "react";
import { cn } from "./utils";

interface TextareaWithCounterProps extends React.ComponentProps<"textarea"> {
  /** Maximum character limit */
  maxLength?: number;
  /** Warning threshold (percentage of max) */
  warningThreshold?: number;
  /** Show character count always or only on focus */
  showCountAlways?: boolean;
  /** Custom label for the counter */
  counterLabel?: string;
}

/**
 * TextareaWithCounter Component
 * 
 * Enhanced textarea with animated character counter.
 * Features:
 * - Animated counter that bumps on change
 * - Color changes as limit approaches
 * - Warning state at configurable threshold
 * - Error state when limit exceeded
 */
const TextareaWithCounter = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithCounterProps
>(
  (
    {
      className,
      maxLength = 500,
      warningThreshold = 0.8,
      showCountAlways = false,
      counterLabel,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const prevCountRef = React.useRef(0);

    const warningLimit = Math.floor(maxLength * warningThreshold);
    const isWarning = charCount >= warningLimit && charCount < maxLength;
    const isError = charCount >= maxLength;

    // Trigger animation on count change
    React.useEffect(() => {
      if (charCount !== prevCountRef.current) {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 200);
        prevCountRef.current = charCount;
        return () => clearTimeout(timer);
      }
    }, [charCount]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const getCounterColor = () => {
      if (isError) return 'text-destructive';
      if (isWarning) return 'text-warning';
      return 'text-muted-foreground';
    };

    const showCounter = showCountAlways || isFocused || charCount > 0;

    return (
      <div className="relative">
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-[100px] w-full rounded-xl border border-border px-4 py-3",
            "text-base bg-input-background text-foreground",
            "placeholder:text-muted-foreground",
            "resize-y",
            "transition-all duration-200 outline-none",
            "hover:border-foreground-muted",
            "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring",
            "dark:focus-visible:ring-primary/40 dark:focus-visible:shadow-[0_0_15px_rgba(0,255,194,0.15)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            isWarning && "border-warning/50 focus-visible:border-warning",
            className
          )}
          maxLength={maxLength}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Character Counter */}
        {showCounter && (
          <div
            className={cn(
              "absolute bottom-2 right-3 text-xs font-medium",
              "transition-all duration-200",
              isAnimating && "counter-bump",
              getCounterColor()
            )}
          >
            {counterLabel && <span className="mr-1">{counterLabel}</span>}
            <span className={cn(isError && "font-bold")}>
              {charCount}
            </span>
            <span className="opacity-60">/{maxLength}</span>
          </div>
        )}
      </div>
    );
  }
);

TextareaWithCounter.displayName = "TextareaWithCounter";

export { TextareaWithCounter };
