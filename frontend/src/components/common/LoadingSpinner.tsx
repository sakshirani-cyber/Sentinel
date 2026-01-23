import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * LoadingSpinner Component
 * 
 * A consistent loading indicator with optional text and sizes.
 * Can be used inline or as a full-screen overlay.
 */
export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const borderWidths = {
    sm: 'border-2',
    md: 'border-[3px]',
    lg: 'border-4',
    xl: 'border-4',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Spinner */}
      <div
        className={`
          ${sizeClasses[size]}
          ${borderWidths[size]}
          border-ribbit-fern/30 dark:border-ribbit-dry-sage/30
          border-t-ribbit-fern dark:border-t-ribbit-dry-sage
          rounded-full
          animate-spin
        `}
      />
      
      {/* Text */}
      {text && (
        <p className={`text-ribbit-pine-teal dark:text-ribbit-dust-grey font-medium ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ribbit-dust-grey/80 dark:bg-ribbit-pine-teal/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * LoadingDots Component
 * 
 * An alternative loading indicator with animated dots.
 */
export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-ribbit-fern dark:bg-ribbit-dry-sage animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Component
 * 
 * Loading skeleton placeholder with shimmer effect.
 */
export function Skeleton({ 
  className = '',
  variant = 'text',
}: { 
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}) {
  const baseClasses = 'animate-pulse bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

/**
 * SkeletonCard Component
 * 
 * A full signal card skeleton for loading states.
 */
export function SkeletonCard() {
  return (
    <div className="bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" className="w-8 h-8" />
        <div className="flex-1">
          <Skeleton className="w-32 h-4 mb-2" />
          <Skeleton className="w-24 h-3" />
        </div>
        <Skeleton variant="rectangular" className="w-20 h-6" />
      </div>
      
      {/* Title */}
      <Skeleton className="w-full h-5 mb-2" />
      <Skeleton className="w-3/4 h-5 mb-4" />
      
      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton variant="rectangular" className="w-16 h-5" />
        <Skeleton variant="rectangular" className="w-12 h-5" />
      </div>
    </div>
  );
}
