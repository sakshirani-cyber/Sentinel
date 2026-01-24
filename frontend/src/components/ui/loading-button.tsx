import * as React from "react";
import { Button, buttonVariants } from "./button";
import { cn } from "./utils";
import { type VariantProps } from "class-variance-authority";
import { Loader2, Check } from "lucide-react";

interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  successDuration?: number;
  onSuccessComplete?: () => void;
}

/**
 * LoadingButton Component
 * 
 * Enhanced button with loading and success states.
 * Features:
 * - Spinning loader animation during loading
 * - Animated checkmark on success
 * - Smooth transitions between states
 * - Disabled interaction during loading
 */
function LoadingButton({
  children,
  className,
  variant,
  size,
  isLoading = false,
  isSuccess = false,
  loadingText,
  successText,
  successDuration = 1500,
  onSuccessComplete,
  disabled,
  ...props
}: LoadingButtonProps) {
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Handle success state with auto-reset
  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onSuccessComplete?.();
      }, successDuration);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, successDuration, onSuccessComplete]);

  const isDisabled = disabled || isLoading || showSuccess;

  return (
    <Button
      variant={showSuccess ? "default" : variant}
      size={size}
      className={cn(
        "relative btn-ripple",
        showSuccess && "bg-success hover:bg-success",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Loading State */}
      {isLoading && (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 spin" />
          {loadingText && <span>{loadingText}</span>}
        </span>
      )}

      {/* Success State */}
      {showSuccess && !isLoading && (
        <span className="flex items-center gap-2 success-pop">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path className="check-animate" d="M5 12l5 5L20 7" />
          </svg>
          {successText && <span>{successText}</span>}
        </span>
      )}

      {/* Default State */}
      {!isLoading && !showSuccess && children}
    </Button>
  );
}

/**
 * IconButton with loading state
 * For icon-only buttons that need loading feedback
 */
function LoadingIconButton({
  children,
  className,
  isLoading = false,
  ...props
}: Omit<LoadingButtonProps, "loadingText" | "successText">) {
  return (
    <Button
      size="icon"
      className={cn("relative", className)}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 spin" />
      ) : (
        children
      )}
    </Button>
  );
}

export { LoadingButton, LoadingIconButton };
