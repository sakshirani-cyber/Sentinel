import { useEffect, useState } from 'react';
import { StepProps } from '../types';
import { Tag, Plus, X, Check } from 'lucide-react';
import { parseLabelsFromText, stripLabelMarkers, parseLabelName } from '../../../utils/labelUtils';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

/**
 * Step 6: Labels
 * 
 * Select labels to organize the signal:
 * - Auto-detected labels from question text
 * - Manual label selection
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
        <div className="w-16 h-16 rounded-full bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
        </div>
        <h2 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
          Add labels to organize
        </h2>
        <p className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          Labels help categorize and filter your signals
        </p>
      </div>

      {/* Auto-detected Labels */}
      {uniqueDetectedLabels.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage flex items-center gap-2">
            <Check className="w-4 h-4 text-ribbit-fern" />
            Auto-detected from your text
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueDetectedLabels.map(labelName => {
              const labelObj = availableLabels.find(l => stripLabelMarkers(l.name) === labelName);
              
              return (
                <span
                  key={labelName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ribbit-fern/10 text-ribbit-fern border border-ribbit-fern/30"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {parseLabelName(labelName)}
                  <span className="ml-1 w-5 h-5 rounded-full bg-ribbit-fern text-white text-xs flex items-center justify-center">
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
          <label className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">
            Manually added
          </label>
          <div className="flex flex-wrap gap-2">
            {manualLabels.map(labelName => (
              <span
                key={labelName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/40 text-ribbit-hunter-green dark:text-ribbit-dry-sage border border-ribbit-fern/20"
              >
                <Tag className="w-3.5 h-3.5" />
                {parseLabelName(labelName)}
                <button
                  onClick={() => handleRemoveLabel(labelName)}
                  className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
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
        <label className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">
          Add more labels
        </label>
        {unselectedLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unselectedLabels.map(label => (
              <button
                key={label.id}
                onClick={() => handleAddLabel(label.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30 text-ribbit-pine-teal dark:text-ribbit-dust-grey border border-ribbit-fern/20 hover:border-ribbit-fern/50 hover:bg-ribbit-dry-sage/30 transition-all group"
                title={label.description}
              >
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                {parseLabelName(label.name)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 italic">
            {availableLabels.length === 0
              ? 'No labels available. Create labels in the Labels page.'
              : 'All available labels are selected.'}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-ribbit-dry-sage/20 dark:bg-ribbit-fern/10 border border-ribbit-fern/20">
        <p className="text-sm text-ribbit-hunter-green dark:text-ribbit-dry-sage">
          <span className="font-medium">{allSelectedLabels.length}</span> label{allSelectedLabels.length !== 1 ? 's' : ''} selected
          {uniqueDetectedLabels.length > 0 && (
            <span className="text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
              {' '}({uniqueDetectedLabels.length} auto-detected)
            </span>
          )}
        </p>
      </div>

      {/* Skip Note */}
      <p className="text-center text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">
        Labels are optional. You can skip this step if you don't need to categorize this signal.
      </p>
    </div>
  );
}
