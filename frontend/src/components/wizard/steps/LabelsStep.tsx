import { useEffect, useState } from 'react';
import { StepProps } from '../types';
import { Tag, Plus, X, Check } from 'lucide-react';
import { parseLabelsFromText, stripLabelMarkers } from '../../../utils/labelUtils';

interface Label {
  id: string;
  name: string;
  description: string;
}

/**
 * Step 6: Labels
 * 
 * Select labels to organize the signal:
 * - Auto-detected labels from question text
 * - Manual label selection
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function LabelsStep({ formData, updateFormData, onValidationChange }: StepProps) {
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);

  // Fetch labels on mount
  useEffect(() => {
    const fetchLabels = async () => {
      if ((window as any).electron?.db) {
        try {
          const result = await (window as any).electron.db.getLabels();
          setAvailableLabels(result.success ? result.data : []);
        } catch (error) {
          console.error('Failed to fetch labels:', error);
        }
      }
    };
    fetchLabels();
  }, []);

  // Labels are always valid (optional step)
  useEffect(() => {
    onValidationChange?.(true);
  }, [onValidationChange]);

  // Get auto-detected labels from question and options
  const detectedLabels = [
    ...parseLabelsFromText(formData.question),
    ...formData.options.flatMap(o => parseLabelsFromText(o)),
  ];
  const uniqueDetectedLabels = [...new Set(detectedLabels)];

  // Manual labels (not detected)
  const manualLabels = formData.labels.filter(l => !uniqueDetectedLabels.includes(l));

  // All selected labels
  const allSelectedLabels = [...new Set([...uniqueDetectedLabels, ...formData.labels])];

  // Available labels not yet selected
  const unselectedLabels = availableLabels.filter(
    l => !allSelectedLabels.includes(stripLabelMarkers(l.name))
  );

  const handleAddLabel = (labelName: string) => {
    const stripped = stripLabelMarkers(labelName);
    if (!formData.labels.includes(stripped)) {
      updateFormData({ labels: [...formData.labels, stripped] });
    }
  };

  const handleRemoveLabel = (labelName: string) => {
    updateFormData({ labels: formData.labels.filter(l => l !== labelName) });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Add labels to organize
        </h2>
        <p className="text-foreground-secondary">
          Labels help categorize and filter your signals
        </p>
      </div>

      {/* Auto-detected Labels */}
      {uniqueDetectedLabels.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            Auto-detected from your text
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueDetectedLabels.map(labelName => {
              return (
                <span
                  key={labelName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 dark:bg-primary/15 text-primary border border-primary/30"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {stripLabelMarkers(labelName)}
                  <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                    {detectedLabels.filter(l => l === labelName).length}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Manually Added Labels */}
      {manualLabels.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Manually added
          </label>
          <div className="flex flex-wrap gap-2">
            {manualLabels.map(labelName => (
              <span
                key={labelName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-secondary dark:bg-muted text-foreground border border-border"
              >
                <Tag className="w-3.5 h-3.5 text-primary" />
                {stripLabelMarkers(labelName)}
                <button
                  onClick={() => handleRemoveLabel(labelName)}
                  className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available Labels */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Add more labels
        </label>
        {unselectedLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unselectedLabels.map(label => (
              <button
                key={label.id}
                onClick={() => handleAddLabel(label.name)}
                className="
                  inline-flex items-center gap-1.5 px-3 py-1.5 
                  rounded-full text-sm font-medium 
                  bg-secondary dark:bg-muted 
                  text-foreground-secondary
                  border border-border 
                  hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 
                  hover:text-foreground
                  transition-all duration-200 group
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                "
                title={label.description}
              >
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-primary" />
                {stripLabelMarkers(label.name)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {availableLabels.length === 0
              ? 'No labels available. Create labels in the Labels page.'
              : 'All available labels are selected.'}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{allSelectedLabels.length}</span> label{allSelectedLabels.length !== 1 ? 's' : ''} selected
          {uniqueDetectedLabels.length > 0 && (
            <span className="text-muted-foreground">
              {' '}({uniqueDetectedLabels.length} auto-detected)
            </span>
          )}
        </p>
      </div>

      {/* Skip Note */}
      <p className="text-center text-xs text-muted-foreground">
        Labels are optional. You can skip this step if you don't need to categorize this signal.
      </p>
    </div>
  );
}
