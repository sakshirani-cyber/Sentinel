import { useState, useEffect } from 'react';
import { parseLabelName } from '../utils/labelUtils';
import { Tag } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  description?: string;
}

interface LabelPillProps {
  labels: string[] | undefined; // Array of label names from poll.labels
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

/**
 * LabelPill Component
 * 
 * Displays label tags with consistent Ribbit forest styling.
 * Per design spec: No individual label colors - uses theme colors.
 */
export default function LabelPill({ 
  labels, 
  className = '',
  showIcon = false,
  size = 'sm',
}: LabelPillProps) {
  const [labelData, setLabelData] = useState<Label[]>([]);

  // Fetch label data on mount for descriptions
  useEffect(() => {
    const fetchLabels = async () => {
      if ((window as any).electron?.db) {
        try {
          const result = await (window as any).electron.db.getLabels();
          setLabelData(result.success ? result.data : []);
        } catch (error) {
          console.error('Failed to fetch labels:', error);
        }
      }
    };
    fetchLabels();
  }, []);

  if (!labels || labels.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {labels.map((labelName) => {
        const labelObj = labelData.find(l => l.name === labelName);

        return (
          <span
            key={labelName}
            className={`
              inline-flex items-center font-medium rounded-full border
              bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20
              border-ribbit-fern/30 dark:border-ribbit-dry-sage/30
              text-ribbit-hunter-green dark:text-ribbit-dry-sage
              transition-all duration-200
              hover:bg-ribbit-dry-sage/50 dark:hover:bg-ribbit-fern/30
              hover:scale-105
              ${sizeClasses[size]}
            `}
            title={labelObj?.description || labelName}
          >
            {showIcon && <Tag className={iconSizes[size]} />}
            {parseLabelName(labelName)}
          </span>
        );
      })}
    </div>
  );
}
