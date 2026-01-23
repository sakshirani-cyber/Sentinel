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
        <div className="w-16 h-16 rounded-full bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center mx-auto mb-4">
          <ListChecks className="w-8 h-8 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
        </div>
        <h2 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
          What are the answer options?
        </h2>
        <p className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
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
            <div className="p-1 text-ribbit-pine-teal/30 dark:text-ribbit-dust-grey/30 cursor-grab">
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Option Number */}
            <span className="w-6 h-6 rounded-full bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50 flex items-center justify-center text-xs font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey">
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
                bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30
                border-2 border-ribbit-fern/30 dark:border-ribbit-dry-sage/20
                text-ribbit-pine-teal dark:text-ribbit-dust-grey
                placeholder:text-ribbit-pine-teal/40 dark:placeholder:text-ribbit-dust-grey/40
                focus:outline-none focus:ring-4 focus:border-ribbit-fern focus:ring-ribbit-fern/20
                transition-all duration-200
              "
            />

            {/* Remove Button */}
            {formData.options.length > 2 && (
              <button
                onClick={() => handleRemoveOption(index)}
                className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
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
          border-2 border-dashed border-ribbit-fern/30 dark:border-ribbit-dry-sage/20
          rounded-xl
          text-ribbit-fern dark:text-ribbit-dry-sage
          hover:bg-ribbit-dry-sage/20 dark:hover:bg-ribbit-fern/10
          hover:border-ribbit-fern dark:hover:border-ribbit-dry-sage
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Plus className="w-5 h-5" />
        <span>Add Option</span>
        {formData.options.length >= 10 && (
          <span className="text-xs text-ribbit-pine-teal/50">(maximum reached)</span>
        )}
      </button>

      {/* Validation Messages */}
      {touched && (
        <div className="space-y-2">
          {validOptionsCount < 2 && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>At least 2 options are required</span>
            </div>
          )}
          {hasDuplicates() && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>Duplicate options are not allowed</span>
            </div>
          )}
        </div>
      )}

      {/* Counter */}
      <div className="text-center">
        <span className={`text-sm ${
          validOptionsCount < 2 ? 'text-red-500' : 'text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50'
        }`}>
          {validOptionsCount} of 10 options used
        </span>
      </div>
    </div>
  );
}
