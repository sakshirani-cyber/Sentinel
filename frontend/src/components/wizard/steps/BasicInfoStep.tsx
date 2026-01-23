import { useEffect, useState } from 'react';
import { StepProps } from '../types';
import { FileText, HelpCircle } from 'lucide-react';

/**
 * Step 1: Basic Info
 * 
 * Collects the signal's question/title and optional description.
 */
export default function BasicInfoStep({ formData, updateFormData, onValidationChange }: StepProps) {
  const [touched, setTouched] = useState({ question: false });

  // Validate on change
  useEffect(() => {
    const isValid = formData.question.trim().length >= 3 && formData.question.trim().length <= 1000;
    onValidationChange?.(isValid);
  }, [formData.question, onValidationChange]);

  const questionError = touched.question && formData.question.trim().length < 3
    ? 'Question must be at least 3 characters'
    : touched.question && formData.question.trim().length > 1000
      ? 'Question must be less than 1000 characters'
      : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
        </div>
        <h2 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
          What's your signal about?
        </h2>
        <p className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          Write a clear question for your recipients
        </p>
      </div>

      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.question}
          onChange={(e) => updateFormData({ question: e.target.value })}
          onBlur={() => setTouched(prev => ({ ...prev, question: true }))}
          rows={3}
          placeholder="e.g., Are you available for the team meeting tomorrow at 3 PM?"
          className={`
            w-full px-4 py-3 rounded-xl
            bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30
            border-2 transition-all duration-200
            text-ribbit-pine-teal dark:text-ribbit-dust-grey
            placeholder:text-ribbit-pine-teal/40 dark:placeholder:text-ribbit-dust-grey/40
            focus:outline-none focus:ring-4
            ${questionError
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
              : 'border-ribbit-fern/30 dark:border-ribbit-dry-sage/20 focus:border-ribbit-fern focus:ring-ribbit-fern/20'
            }
          `}
        />
        <div className="flex items-center justify-between mt-2">
          {questionError ? (
            <p className="text-sm text-red-500">{questionError}</p>
          ) : (
            <p className="text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">
              Tip: Use # to add inline labels (e.g., #urgent, #hr-team)
            </p>
          )}
          <span className={`text-xs ${
            formData.question.length > 900 
              ? 'text-red-500' 
              : 'text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50'
          }`}>
            {formData.question.length}/1000
          </span>
        </div>
      </div>

      {/* Description (Optional) */}
      <div>
        <label className="block text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
          Description <span className="text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">(optional)</span>
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={2}
          placeholder="Add more context or instructions for recipients..."
          className="
            w-full px-4 py-3 rounded-xl
            bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30
            border-2 border-ribbit-fern/30 dark:border-ribbit-dry-sage/20
            text-ribbit-pine-teal dark:text-ribbit-dust-grey
            placeholder:text-ribbit-pine-teal/40 dark:placeholder:text-ribbit-dust-grey/40
            focus:outline-none focus:ring-4 focus:border-ribbit-fern focus:ring-ribbit-fern/20
            transition-all duration-200
          "
        />
      </div>

      {/* Tip Card */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-ribbit-dry-sage/20 dark:bg-ribbit-fern/10 border border-ribbit-fern/20">
        <HelpCircle className="w-5 h-5 text-ribbit-fern flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">
            Writing effective questions
          </p>
          <ul className="mt-1 text-xs text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 space-y-1">
            <li>• Be specific and clear about what you're asking</li>
            <li>• Include any relevant context (dates, times, names)</li>
            <li>• Keep it concise but complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
