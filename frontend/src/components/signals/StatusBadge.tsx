import { Clock, CheckCircle, AlertCircle, Calendar, FileEdit, Send } from 'lucide-react';

export type SignalStatus = 'active' | 'completed' | 'incomplete' | 'scheduled' | 'draft' | 'expired';

interface StatusBadgeProps {
  status: SignalStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<SignalStatus, {
  icon: typeof Clock;
  label: string;
  bgClassName: string;
  textClassName: string;
  borderClassName: string;
  pulseClassName?: string;
  hoverClassName?: string;
}> = {
  active: {
    icon: Send,
    label: 'Active',
    bgClassName: 'bg-primary/10 dark:bg-primary/20',
    textClassName: 'text-primary dark:text-primary',
    borderClassName: 'border-primary/30 dark:border-primary/40',
    pulseClassName: 'status-pulse',
    hoverClassName: 'hover:bg-primary/15 dark:hover:bg-primary/25 hover:shadow-sm dark:hover:shadow-[0_0_10px_rgba(0,255,194,0.2)]',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    bgClassName: 'bg-success/10 dark:bg-success/20',
    textClassName: 'text-success dark:text-success',
    borderClassName: 'border-success/30 dark:border-success/40',
    hoverClassName: 'hover:bg-success/15 dark:hover:bg-success/25 hover:shadow-sm',
  },
  incomplete: {
    icon: Clock,
    label: 'Pending',
    bgClassName: 'bg-warning/10 dark:bg-warning/20',
    textClassName: 'text-warning dark:text-warning',
    borderClassName: 'border-warning/30 dark:border-warning/40',
    pulseClassName: 'pulse-dot',
    hoverClassName: 'hover:bg-warning/15 dark:hover:bg-warning/25 hover:shadow-sm',
  },
  scheduled: {
    icon: Calendar,
    label: 'Scheduled',
    bgClassName: 'bg-info/10 dark:bg-info/20',
    textClassName: 'text-info dark:text-info',
    borderClassName: 'border-info/30 dark:border-info/40',
    hoverClassName: 'hover:bg-info/15 dark:hover:bg-info/25 hover:shadow-sm',
  },
  draft: {
    icon: FileEdit,
    label: 'Draft',
    bgClassName: 'bg-muted dark:bg-muted',
    textClassName: 'text-muted-foreground',
    borderClassName: 'border-border',
    hoverClassName: 'hover:bg-muted/80 hover:shadow-sm',
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    bgClassName: 'bg-destructive/10 dark:bg-destructive/20',
    textClassName: 'text-destructive dark:text-destructive',
    borderClassName: 'border-destructive/30 dark:border-destructive/40',
    hoverClassName: 'hover:bg-destructive/15 dark:hover:bg-destructive/25 hover:shadow-sm',
  },
};

/**
 * StatusBadge Component
 * 
 * Displays signal status with consistent styling.
 * Features:
 * - Pulse animation for active/pending statuses
 * - Hover glow effect
 * - Smooth transitions
 */
export default function StatusBadge({ 
  status, 
  size = 'sm',
  showIcon = true,
  showPulse = true,
}: StatusBadgeProps & { showPulse?: boolean }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Determine if we should show the pulse indicator
  const shouldPulse = showPulse && (status === 'active' || status === 'incomplete');
  
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border cursor-default
        ${config.bgClassName} ${config.textClassName} ${config.borderClassName}
        ${config.hoverClassName || ''}
        ${sizeClasses[size]}
        transition-all duration-200
      `}
    >
      {/* Pulsing dot indicator for active states */}
      {shouldPulse && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span className={`absolute inline-flex h-full w-full rounded-full bg-current opacity-75 pulse-dot`} />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {showIcon && !shouldPulse && <Icon className={`${iconSizes[size]} transition-transform duration-200`} />}
      {config.label}
    </span>
  );
}

/**
 * Get status from poll data
 */
export function getSignalStatus(poll: {
  status: string;
  deadline: string;
  hasResponse?: boolean;
}): SignalStatus {
  const now = new Date();
  const deadline = new Date(poll.deadline);
  
  if (poll.status === 'scheduled') return 'scheduled';
  if (poll.status === 'completed' || deadline < now) {
    if (poll.hasResponse) return 'completed';
    return 'expired';
  }
  if (poll.hasResponse) return 'completed';
  return 'incomplete';
}
