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
    bgClassName: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
  },
  anonymous: {
    icon: EyeOff,
    label: 'Anonymous',
    className: 'text-purple-600 dark:text-purple-200',
    bgClassName: 'bg-purple-50 dark:bg-slate-800 border-purple-200 dark:border-purple-600',
  },
  record: {
    icon: Shield,
    label: 'Recorded',
    className: 'text-green-600 dark:text-green-100',
    bgClassName: 'bg-green-50 dark:bg-slate-800 border-green-200 dark:border-green-600',
  },
  edited: {
    icon: Pencil,
    label: 'Edited',
    className: 'text-amber-600 dark:text-amber-400',
    bgClassName: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700',
  },
  scheduled: {
    icon: Clock,
    label: 'Scheduled',
    className: 'text-blue-600 dark:text-blue-400',
    bgClassName: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
  },
  urgent: {
    icon: AlertTriangle,
    label: 'Urgent',
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
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
