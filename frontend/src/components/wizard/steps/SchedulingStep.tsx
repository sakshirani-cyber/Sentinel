import { useEffect } from 'react';
import { StepProps } from '../types';
import { Calendar, Clock, CalendarClock, AlertCircle } from 'lucide-react';

/**
 * Step 5: Scheduling
 * 
 * Set deadline and optional scheduled publish time.
 */
export default function SchedulingStep({ formData, updateFormData, onValidationChange }: StepProps) {
  // Get minimum datetime (5 minutes from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const isDeadlineValid = () => {
    if (!formData.deadline) return false;
    return new Date(formData.deadline) > new Date();
  };

  const isScheduleTimeValid = () => {
    if (!formData.isScheduled || !formData.scheduleTime) return true;
    const scheduleDate = new Date(formData.scheduleTime);
    const now = new Date();
    
    if (scheduleDate <= now) return false;
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      if (scheduleDate >= deadlineDate) return false;
    }
    return true;
  };

  // Validate
  useEffect(() => {
    const deadlineOk = isDeadlineValid();
    const scheduleOk = !formData.isScheduled || (formData.scheduleTime && isScheduleTimeValid());
    onValidationChange?.(deadlineOk && !!scheduleOk);
  }, [formData.deadline, formData.isScheduled, formData.scheduleTime, onValidationChange]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          When is the deadline?
        </h2>
        <p className="text-foreground-secondary">
          Set when responses are due and optionally schedule for later
        </p>
      </div>

      {/* Deadline Input */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="w-4 h-4 text-primary" />
          Response Deadline <span className="text-destructive">*</span>
        </label>
        <input
          type="datetime-local"
          value={formData.deadline}
          onChange={(e) => updateFormData({ deadline: e.target.value })}
          min={getMinDateTime()}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-input-background dark:bg-input
            border-2 transition-all duration-200
            text-foreground
            focus:outline-none focus:ring-4
            ${!isDeadlineValid() && formData.deadline
              ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
              : 'border-border hover:border-foreground-muted focus:border-primary focus:ring-ring'
            }
          `}
        />
        {!isDeadlineValid() && formData.deadline && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            Deadline must be in the future
          </p>
        )}
        <p className="text-xs text-foreground-muted">
          Reminders will be sent at 60, 30, 15, and 1 minute before deadline
        </p>
      </div>

      {/* Schedule Toggle Card */}
      <div
        onClick={() => updateFormData({ isScheduled: !formData.isScheduled })}
        className={`
          p-5 rounded-xl cursor-pointer transition-all duration-200
          border-2
          ${formData.isScheduled
            ? 'bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 border-ribbit-fern dark:border-ribbit-dry-sage'
            : 'bg-ribbit-dust-grey/30 dark:bg-ribbit-hunter-green/20 border-ribbit-fern/20 dark:border-ribbit-dry-sage/10 hover:border-ribbit-fern/40'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all
              ${formData.isScheduled
                ? 'bg-ribbit-fern text-white scale-110 shadow-lg'
                : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50 text-ribbit-pine-teal/50'
              }
            `}>
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <p className={`font-semibold ${
                formData.isScheduled 
                  ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage' 
                  : 'text-ribbit-pine-teal dark:text-ribbit-dust-grey'
              }`}>
                Schedule for Later
              </p>
              <p className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
                Automatically publish at a future date
              </p>
            </div>
          </div>
          <div className={`
            relative w-11 h-6 rounded-full transition-colors
            ${formData.isScheduled ? 'bg-ribbit-fern' : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50'}
          `}>
            <div
              className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: formData.isScheduled ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
            />
          </div>
        </div>

        {/* Schedule Time Input */}
        {formData.isScheduled && (
          <div 
            className="mt-5 pt-5 border-t border-ribbit-fern/20 dark:border-ribbit-dry-sage/20"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-3">
              <CalendarClock className="w-4 h-4" />
              Publish At <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.scheduleTime}
              onChange={(e) => updateFormData({ scheduleTime: e.target.value })}
              min={getMinDateTime()}
              max={formData.deadline}
              className={`
                w-full px-4 py-3 rounded-xl
                bg-ribbit-dust-grey/70 dark:bg-ribbit-hunter-green/40
                border-2 transition-all duration-200
                text-ribbit-pine-teal dark:text-ribbit-dust-grey
                focus:outline-none focus:ring-4
                ${!isScheduleTimeValid()
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                  : 'border-ribbit-fern/30 dark:border-ribbit-dry-sage/20 focus:border-ribbit-fern focus:ring-ribbit-fern/20'
                }
              `}
            />
            {!isScheduleTimeValid() && formData.scheduleTime && (
              <p className="flex items-center gap-1.5 text-sm text-red-500 mt-2">
                <AlertCircle className="w-4 h-4" />
                {new Date(formData.scheduleTime) <= new Date()
                  ? 'Schedule time must be in the future'
                  : 'Schedule time must be before the deadline'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {formData.deadline && isDeadlineValid() && (
        <div className="p-4 rounded-xl bg-ribbit-dry-sage/20 dark:bg-ribbit-fern/10 border border-ribbit-fern/20">
          <p className="text-sm text-ribbit-hunter-green dark:text-ribbit-dry-sage">
            {formData.isScheduled && formData.scheduleTime ? (
              <>
                <span className="font-medium">Scheduled to publish:</span>{' '}
                {new Date(formData.scheduleTime).toLocaleString()}
                <br />
              </>
            ) : null}
            <span className="font-medium">Responses due by:</span>{' '}
            {new Date(formData.deadline).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
