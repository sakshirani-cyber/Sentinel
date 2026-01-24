import { cn } from '../ui/utils';

interface AnimatedIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

/**
 * PulsingDot
 * 
 * A pulsing circular dot for indicating live/active status.
 */
export function PulsingDot({ 
  className, 
  size = 'md',
  color = 'bg-success'
}: AnimatedIconProps) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "absolute inline-flex rounded-full opacity-75 pulse-dot",
          sizeClasses[size],
          color
        )}
      />
      <span
        className={cn(
          "relative inline-flex rounded-full",
          sizeClasses[size],
          color
        )}
      />
    </span>
  );
}

/**
 * BouncingBell
 * 
 * An animated bell icon that rings when triggered.
 */
export function BouncingBell({ 
  className,
  isRinging = false,
  size = 'md'
}: AnimatedIconProps & { isRinging?: boolean }) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={cn(
        iconSizes[size],
        isRinging && "bell-ring",
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/**
 * SpinningLoader
 * 
 * A consistent spinning loader indicator.
 */
export function SpinningLoader({ 
  className,
  size = 'md'
}: AnimatedIconProps) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={cn(
        iconSizes[size],
        "spin text-current",
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * CheckmarkAnimated
 * 
 * An animated checkmark that draws itself on mount.
 */
export function CheckmarkAnimated({ 
  className,
  size = 'md',
  color = 'text-success'
}: AnimatedIconProps) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={cn(
        iconSizes[size],
        color,
        "success-pop",
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        className="check-animate"
        d="M5 12l5 5L20 7"
      />
    </svg>
  );
}

/**
 * AnimatedBadgeCount
 * 
 * A badge that pops when the count changes.
 */
export function AnimatedBadgeCount({
  count,
  className,
  max = 99,
}: {
  count: number;
  className?: string;
  max?: number;
}) {
  const displayCount = count > max ? `${max}+` : count;

  if (count <= 0) return null;

  return (
    <span
      key={count} // Re-render triggers animation
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[18px] h-[18px] px-1",
        "text-xs font-semibold rounded-full",
        "bg-destructive text-white",
        "badge-pop",
        className
      )}
    >
      {displayCount}
    </span>
  );
}

/**
 * LoadingDots
 * 
 * Three dots that animate in sequence for loading states.
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex gap-1", className)}>
      <span 
        className="w-1.5 h-1.5 bg-current rounded-full opacity-60"
        style={{ animation: 'pulse-dot 1s ease-in-out infinite' }}
      />
      <span 
        className="w-1.5 h-1.5 bg-current rounded-full opacity-60"
        style={{ animation: 'pulse-dot 1s ease-in-out 0.2s infinite' }}
      />
      <span 
        className="w-1.5 h-1.5 bg-current rounded-full opacity-60"
        style={{ animation: 'pulse-dot 1s ease-in-out 0.4s infinite' }}
      />
    </span>
  );
}

/**
 * StatusIndicator
 * 
 * A status dot with optional pulse animation for active states.
 */
export function StatusIndicator({
  status,
  className,
  showPulse = true,
}: {
  status: 'active' | 'pending' | 'completed' | 'error' | 'inactive';
  className?: string;
  showPulse?: boolean;
}) {
  const statusColors = {
    active: 'bg-success',
    pending: 'bg-warning',
    completed: 'bg-primary',
    error: 'bg-destructive',
    inactive: 'bg-muted-foreground',
  };

  const shouldPulse = showPulse && (status === 'active' || status === 'pending');

  return (
    <span className={cn("relative inline-flex", className)}>
      {shouldPulse && (
        <span
          className={cn(
            "absolute inline-flex w-2.5 h-2.5 rounded-full opacity-75 pulse-dot",
            statusColors[status]
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex w-2.5 h-2.5 rounded-full",
          statusColors[status]
        )}
      />
    </span>
  );
}
