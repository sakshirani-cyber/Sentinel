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
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-primary mb-2">
          What's your signal about?
        </h2>
        <p className="text-foreground-secondary">
          Write a clear question for your recipients
        </p>
      </div>

      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Question <span className="text-destructive">*</span>
        </label>
        <textarea
          value={formData.question}
          onChange={(e) => updateFormData({ question: e.target.value })}
          onBlur={() => setTouched(prev => ({ ...prev, question: true }))}
          rows={3}
          placeholder="e.g., Are you available for the team meeting tomorrow at 3 PM?"
          className={`
            w-full px-4 py-3 rounded-xl
            bg-background dark:bg-input-background
            border-2 transition-all duration-200
            text-foreground
            placeholder:text-foreground-muted
            focus:outline-none focus:ring-4
            ${questionError
              ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
              : 'border-border focus:border-primary focus:ring-ring'
            }
          `}
        />
        <div className="flex items-center justify-between mt-2">
          {questionError ? (
            <p className="text-sm text-destructive">{questionError}</p>
          ) : (
            <p className="text-xs text-foreground-muted">
              Tip: Use # to add inline labels (e.g., #urgent, #hr-team)
            </p>
          )}
          <span className={`text-xs ${
            formData.question.length > 900 
              ? 'text-destructive' 
              : 'text-foreground-muted'
          }`}>
            {formData.question.length}/1000
          </span>
        </div>
      </div>

      {/* Description (Optional) */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
          Description <span className="text-foreground-muted">(optional)</span>
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={2}
          placeholder="Add more context or instructions for recipients..."
          className="
            w-full px-4 py-3 rounded-xl
            bg-background dark:bg-input-background
            border-2 border-border
            text-foreground
            placeholder:text-foreground-muted
            focus:outline-none focus:ring-4 focus:border-primary focus:ring-ring
            transition-all duration-200
          "
        />
      </div>

      {/* Tip Card */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary dark:bg-secondary border border-border">
        <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">
            Writing effective questions
          </p>
          <ul className="mt-1 text-xs text-foreground-secondary space-y-1">
            <li>• Be specific and clear about what you're asking</li>
            <li>• Include any relevant context (dates, times, names)</li>
            <li>• Keep it concise but complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
