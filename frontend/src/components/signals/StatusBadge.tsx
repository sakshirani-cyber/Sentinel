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
}> = {
  active: {
    icon: Send,
    label: 'Active',
    bgClassName: 'bg-ribbit-fern/15 dark:bg-ribbit-fern/25',
    textClassName: 'text-ribbit-fern dark:text-ribbit-dry-sage',
    borderClassName: 'border-ribbit-fern/30',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    bgClassName: 'bg-ribbit-hunter-green/15 dark:bg-ribbit-hunter-green/25',
    textClassName: 'text-ribbit-hunter-green dark:text-ribbit-dry-sage',
    borderClassName: 'border-ribbit-hunter-green/30',
  },
  incomplete: {
    icon: Clock,
    label: 'Pending',
    bgClassName: 'bg-amber-100 dark:bg-amber-900/30',
    textClassName: 'text-amber-700 dark:text-amber-400',
    borderClassName: 'border-amber-300 dark:border-amber-700',
  },
  scheduled: {
    icon: Calendar,
    label: 'Scheduled',
    bgClassName: 'bg-blue-100 dark:bg-blue-900/30',
    textClassName: 'text-blue-700 dark:text-blue-400',
    borderClassName: 'border-blue-300 dark:border-blue-700',
  },
  draft: {
    icon: FileEdit,
    label: 'Draft',
    bgClassName: 'bg-ribbit-dust-grey/60 dark:bg-ribbit-pine-teal/40',
    textClassName: 'text-ribbit-pine-teal dark:text-ribbit-dust-grey',
    borderClassName: 'border-ribbit-dry-sage/50',
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    bgClassName: 'bg-gray-100 dark:bg-gray-800',
    textClassName: 'text-gray-600 dark:text-gray-400',
    borderClassName: 'border-gray-300 dark:border-gray-700',
  },
};

/**
 * StatusBadge Component
 * 
 * Displays signal status with consistent styling.
 */
export default function StatusBadge({ 
  status, 
  size = 'sm',
  showIcon = true 
}: StatusBadgeProps) {
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
  
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.bgClassName} ${config.textClassName} ${config.borderClassName}
        ${sizeClasses[size]}
        transition-all duration-200
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
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
