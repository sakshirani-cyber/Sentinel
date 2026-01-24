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
  signalAnimation?: string;
}> = {
  active: {
    icon: Send,
    label: 'Active',
    // Signal-inspired gradient background
    bgClassName: 'bg-gradient-to-r from-[rgba(10,143,129,0.08)] to-[rgba(10,143,129,0.12)] dark:from-[rgba(0,245,184,0.1)] dark:to-[rgba(0,245,184,0.15)]',
    textClassName: 'text-[#0A8F81] dark:text-[#00F5B8]',
    borderClassName: 'border-[rgba(10,143,129,0.3)] dark:border-[rgba(0,245,184,0.35)]',
    pulseClassName: 'status-signal',
    hoverClassName: 'hover:from-[rgba(10,143,129,0.12)] hover:to-[rgba(10,143,129,0.18)] dark:hover:from-[rgba(0,245,184,0.15)] dark:hover:to-[rgba(0,245,184,0.22)] hover:shadow-[0_2px_8px_rgba(10,143,129,0.18)] dark:hover:shadow-[0_0_12px_rgba(0,245,184,0.25)]',
    signalAnimation: 'status-signal',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    bgClassName: 'bg-[#E8F5F0] dark:bg-[rgba(52,211,153,0.15)]',
    textClassName: 'text-success dark:text-[#34D399]',
    borderClassName: 'border-success/30 dark:border-[rgba(52,211,153,0.4)]',
    hoverClassName: 'hover:bg-[#DCF0E8] dark:hover:bg-[rgba(52,211,153,0.2)] hover:shadow-[0_2px_8px_rgba(16,185,129,0.15)]',
  },
  incomplete: {
    icon: Clock,
    label: 'Pending',
    bgClassName: 'bg-[#FFF8E6] dark:bg-[rgba(251,191,36,0.15)]',
    textClassName: 'text-warning dark:text-[#FBBF24]',
    borderClassName: 'border-warning/30 dark:border-[rgba(251,191,36,0.4)]',
    pulseClassName: 'frequency-pulse',
    hoverClassName: 'hover:bg-[#FFF3D6] dark:hover:bg-[rgba(251,191,36,0.2)] hover:shadow-[0_2px_8px_rgba(245,158,11,0.15)]',
  },
  scheduled: {
    icon: Calendar,
    label: 'Scheduled',
    bgClassName: 'bg-[#EFF6FF] dark:bg-[rgba(96,165,250,0.15)]',
    textClassName: 'text-info dark:text-[#60A5FA]',
    borderClassName: 'border-info/30 dark:border-[rgba(96,165,250,0.4)]',
    hoverClassName: 'hover:bg-[#E0EFFF] dark:hover:bg-[rgba(96,165,250,0.2)] hover:shadow-[0_2px_8px_rgba(59,130,246,0.15)]',
  },
  draft: {
    icon: FileEdit,
    label: 'Draft',
    bgClassName: 'bg-[#E8F0E8] dark:bg-[rgba(168,174,174,0.1)]',
    textClassName: 'text-muted-foreground',
    borderClassName: 'border-[#C8D4D8] dark:border-[#262B30]',
    hoverClassName: 'hover:bg-[#DCE6DC] dark:hover:bg-[rgba(168,174,174,0.15)] hover:shadow-[0_2px_6px_rgba(15,23,42,0.08)]',
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    bgClassName: 'bg-[#FEF2F2] dark:bg-[rgba(248,113,113,0.15)]',
    textClassName: 'text-destructive dark:text-[#F87171]',
    borderClassName: 'border-destructive/30 dark:border-[rgba(248,113,113,0.4)]',
    hoverClassName: 'hover:bg-[#FEE8E8] dark:hover:bg-[rgba(248,113,113,0.2)] hover:shadow-[0_2px_8px_rgba(239,68,68,0.15)]',
  },
};

/**
 * StatusBadge Component
 * 
 * Displays signal status with consistent "Signal Wildlife" styling.
 * Features:
 * - Signal ring animation for active status
 * - Frequency pulse for pending status
 * - Organic color gradients
 * - Hover glow effects
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
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Determine if we should show the pulse indicator
  const shouldPulse = showPulse && (status === 'active' || status === 'incomplete');
  // Use signal animation for active status
  const isSignalActive = status === 'active' && showPulse;
  
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border cursor-default
        ${config.bgClassName} ${config.textClassName} ${config.borderClassName}
        ${config.hoverClassName || ''}
        ${isSignalActive ? config.signalAnimation || '' : ''}
        ${sizeClasses[size]}
        transition-all duration-200
        backdrop-blur-sm
      `}
    >
      {/* Signal ring indicator for active state */}
      {isSignalActive && (
        <span className="relative flex h-2 w-2 mr-1">
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 status-signal" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {/* Frequency pulse indicator for pending state */}
      {status === 'incomplete' && showPulse && (
        <span className="relative flex h-2 w-2 mr-1">
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 pulse-dot" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {/* Regular icon for other states */}
      {showIcon && !shouldPulse && (
        <Icon className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-110`} />
      )}
      <span className="font-semibold tracking-tight">{config.label}</span>
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
