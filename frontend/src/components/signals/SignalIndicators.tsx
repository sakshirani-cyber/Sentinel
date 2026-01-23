import { Pin, EyeOff, Pencil, Clock, Shield, AlertTriangle } from 'lucide-react';

type IndicatorType = 'persistent' | 'anonymous' | 'edited' | 'scheduled' | 'record' | 'urgent';

interface SignalIndicatorProps {
  type: IndicatorType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const indicatorConfig: Record<IndicatorType, {
  icon: typeof Pin;
  label: string;
  className: string;
  bgClassName: string;
}> = {
  persistent: {
    icon: Pin,
    label: 'Persistent',
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  },
  anonymous: {
    icon: EyeOff,
    label: 'Anonymous',
    className: 'text-ribbit-fern dark:text-ribbit-dry-sage',
    bgClassName: 'bg-ribbit-fern/10 dark:bg-ribbit-fern/20 border-ribbit-fern/30',
  },
  record: {
    icon: Shield,
    label: 'Recorded',
    className: 'text-ribbit-hunter-green dark:text-ribbit-dry-sage',
    bgClassName: 'bg-ribbit-hunter-green/10 dark:bg-ribbit-hunter-green/20 border-ribbit-hunter-green/30',
  },
  edited: {
    icon: Pencil,
    label: 'Edited',
    className: 'text-amber-600 dark:text-amber-400',
    bgClassName: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  },
  scheduled: {
    icon: Clock,
    label: 'Scheduled',
    className: 'text-blue-600 dark:text-blue-400',
    bgClassName: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  },
  urgent: {
    icon: AlertTriangle,
    label: 'Urgent',
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  },
};

/**
 * SignalIndicator Component
 * 
 * Individual indicator for signal status.
 */
export function SignalIndicator({ type, size = 'sm', showLabel = true }: SignalIndicatorProps) {
  const config = indicatorConfig[type];
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${config.bgClassName} ${padding}
        transition-all duration-200 hover:scale-105
      `}
      title={config.label}
    >
      <Icon className={`${iconSize} ${config.className}`} />
      {showLabel && (
        <span className={`${textSize} font-medium ${config.className}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

interface SignalIndicatorsProps {
  isPersistent?: boolean;
  isAnonymous?: boolean;
  isEdited?: boolean;
  isScheduled?: boolean;
  isUrgent?: boolean;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

/**
 * SignalIndicators Component
 * 
 * Shows all applicable indicators for a signal.
 */
export default function SignalIndicators({
  isPersistent,
  isAnonymous,
  isEdited,
  isScheduled,
  isUrgent,
  size = 'sm',
  showLabels = true,
}: SignalIndicatorsProps) {
  const indicators: IndicatorType[] = [];
  
  if (isUrgent) indicators.push('urgent');
  if (isPersistent) indicators.push('persistent');
  if (isScheduled) indicators.push('scheduled');
  if (isAnonymous) indicators.push('anonymous');
  else if (!isAnonymous && isAnonymous !== undefined) indicators.push('record');
  if (isEdited) indicators.push('edited');
  
  if (indicators.length === 0) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {indicators.map((type) => (
        <SignalIndicator 
          key={type} 
          type={type} 
          size={size} 
          showLabel={showLabels} 
        />
      ))}
    </div>
  );
}
