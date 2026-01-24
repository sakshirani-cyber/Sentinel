/**
 * ResponseDistribution Component
 * 
 * Horizontal bar chart showing response distribution with:
 * - Animated progress bars with gradient fills
 * - Count and percentage display
 * - Badges for "Default" and "Removed" options
 */

import { useState, useEffect } from 'react';
import { Archive } from 'lucide-react';
import LabelText from '../LabelText';

interface ResponseOption {
  text: string;
  count: number;
  percentage: number;
  isDefault?: boolean;
  isRemoved?: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface ResponseDistributionProps {
  options: ResponseOption[];
  labels?: Label[];
  className?: string;
}

export default function ResponseDistribution({
  options,
  labels = [],
  className = '',
}: ResponseDistributionProps) {
  const [animate, setAnimate] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Find max count for scaling
  const maxCount = Math.max(...options.map(o => o.count), 1);

  if (options.length === 0) {
    return (
      <div className={`text-center py-8 text-foreground-muted ${className}`}>
        No response options available
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {options.map((option, index) => {
        const barWidth = (option.count / maxCount) * 100;
        
        return (
          <div
            key={index}
            className="group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Option label and count */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  <LabelText text={option.text} labels={labels} />
                </span>
                
                {/* Badges */}
                {option.isDefault && (
                  <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium border border-warning/20">
                    Default
                  </span>
                )}
                {option.isRemoved && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground-muted font-medium border border-border">
                    <Archive className="w-3 h-3" />
                    Removed
                  </span>
                )}
              </div>
              
              <div className="flex-shrink-0 ml-4 text-right">
                <span className="text-sm font-semibold text-foreground">
                  {option.count}
                </span>
                <span className="text-xs text-foreground-muted ml-1">
                  ({option.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-4 bg-border/50 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                style={{
                  width: animate ? `${Math.max(barWidth, option.count > 0 ? 8 : 0)}%` : '0%',
                  transitionDelay: `${index * 50}ms`,
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
                }}
              />
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-1000" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
