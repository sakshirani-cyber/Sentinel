import { useEffect, useState } from 'react';
import { StepProps } from '../types';
import { ListChecks, Plus, X, GripVertical, AlertCircle } from 'lucide-react';

/**
 * Step 2: Options
 * 
 * Allows adding/removing answer options with:
 * - Minimum 2 options required
 * - Maximum 10 options
 * - Duplicate detection
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function OptionsStep({ formData, updateFormData, onValidationChange }: StepProps) {
  const [touched, setTouched] = useState(false);

  // Check for duplicates
  const hasDuplicates = () => {
    const validOptions = formData.options.filter(o => o.trim()).map(o => o.trim().toLowerCase());
    return new Set(validOptions).size !== validOptions.length;
  };

  const validOptionsCount = formData.options.filter(o => o.trim()).length;

  // Validate
  useEffect(() => {
    const isValid = validOptionsCount >= 2 && validOptionsCount <= 10 && !hasDuplicates();
    onValidationChange?.(isValid);
  }, [formData.options, onValidationChange]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    updateFormData({ options: newOptions });
  };

  const handleAddOption = () => {
    if (formData.options.length < 10) {
      updateFormData({ options: [...formData.options, ''] });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      updateFormData({ options: formData.options.filter((_, i) => i !== index) });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <ListChecks className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          What are the answer options?
        </h2>
        <p className="text-foreground-secondary">
          Add between 2-10 options for recipients to choose from
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        {formData.options.map((option, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 group animate-fade-in"
          >
            {/* Drag Handle (visual only for now) */}
            <div className="p-1 text-muted-foreground/50 cursor-grab hover:text-muted-foreground transition-colors">
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Option Number */}
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>

            {/* Input */}
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={`Option ${index + 1}`}
              className="
                flex-1 px-4 py-3 rounded-xl
                bg-input-background dark:bg-input
                border-2 border-border
                text-foreground
                placeholder:text-muted-foreground
                focus:outline-none focus:ring-4 focus:border-primary focus:ring-ring
                hover:border-foreground-muted
                transition-all duration-200
              "
            />

            {/* Remove Button */}
            {formData.options.length > 2 && (
              <button
                onClick={() => handleRemoveOption(index)}
                className="
                  p-2 rounded-lg 
                  text-destructive/70 
                  hover:text-destructive 
                  hover:bg-destructive/10 
                  transition-all duration-200 
                  opacity-0 group-hover:opacity-100
                  focus:opacity-100
                "
                aria-label="Remove option"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Option Button */}
      <button
        onClick={handleAddOption}
        disabled={formData.options.length >= 10}
        className="
          w-full flex items-center justify-center gap-2 px-4 py-3
          border-2 border-dashed border-border
          rounded-xl
          text-primary
          hover:bg-primary/5 dark:hover:bg-primary/10
          hover:border-primary/50
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
        "
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add Option</span>
        {formData.options.length >= 10 && (
          <span className="text-xs text-muted-foreground">(maximum reached)</span>
        )}
      </button>

      {/* Validation Messages */}
      {touched && (
        <div className="space-y-2">
          {validOptionsCount < 2 && (
            <div className="flex items-center gap-2 text-sm text-destructive font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>At least 2 options are required</span>
            </div>
          )}
          {hasDuplicates() && (
            <div className="flex items-center gap-2 text-sm text-destructive font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Duplicate options are not allowed</span>
            </div>
          )}
        </div>
      )}

      {/* Counter */}
      <div className="text-center">
        <span className={`text-sm font-medium ${
          validOptionsCount < 2 ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {validOptionsCount} of 10 options used
        </span>
      </div>
    </div>
  );
}
