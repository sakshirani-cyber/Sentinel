/**
 * DonutChart Component
 * 
 * Custom SVG donut chart for visualizing response distribution.
 * Features:
 * - Animated segments with CSS transitions
 * - Center displays total count
 * - Legend with color-coded options
 * - Responsive design
 */

import { useMemo } from 'react';

interface DonutSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  isDefault?: boolean;
  isRemoved?: boolean;
}

interface DonutChartProps {
  data: DonutSegment[];
  total: number;
  centerLabel?: string;
  className?: string;
}

// Color palette for chart segments (uses CSS variables)
const SEGMENT_COLORS = [
  'var(--primary)',      // Teal / Cyan
  'var(--accent)',       // Pink / Coral
  'var(--success)',      // Green
  'var(--warning)',      // Amber
  'var(--info)',         // Blue
  'var(--destructive)',  // Red
  'var(--muted-foreground)', // Gray for additional segments
];

export default function DonutChart({
  data,
  total,
  centerLabel = 'Responses',
  className = '',
}: DonutChartProps) {
  // SVG dimensions
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate segment positions
  const segments = useMemo(() => {
    let currentOffset = 0;
    
    return data.map((item, index) => {
      const segmentLength = (item.percentage / 100) * circumference;
      const offset = currentOffset;
      currentOffset += segmentLength;
      
      return {
        ...item,
        color: item.color || SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        dashArray: `${segmentLength} ${circumference - segmentLength}`,
        dashOffset: -offset,
      };
    });
  }, [data, circumference]);

  // Handle empty state
  if (data.length === 0 || total === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <div className="relative w-48 h-48">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={strokeWidth}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground-muted">0</span>
            <span className="text-sm text-foreground-muted">{centerLabel}</span>
          </div>
        </div>
        <p className="text-foreground-muted text-sm mt-4">No responses yet</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row items-center gap-6 ${className}`}>
      {/* Donut Chart */}
      <div className="relative w-48 h-48 flex-shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
          />
          
          {/* Segment arcs */}
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-700 ease-out"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            />
          ))}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{total}</span>
          <span className="text-sm text-foreground-secondary">{centerLabel}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              
              {/* Label and value */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {segment.label}
                  </span>
                  {segment.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
                      Default
                    </span>
                  )}
                  {segment.isRemoved && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground-muted font-medium">
                      Removed
                    </span>
                  )}
                </div>
                <div className="text-xs text-foreground-secondary">
                  {segment.value} ({segment.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export the color palette for use in other components
export { SEGMENT_COLORS };
