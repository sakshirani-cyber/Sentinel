import { useEffect } from 'react';
import { StepProps } from '../types';
import { Calendar, Clock, CalendarClock, AlertCircle } from 'lucide-react';
import DateTimePicker from '../../ui/DateTimePicker';

/**
 * Step 5: Scheduling
 * 
 * Set deadline and optional scheduled publish time.
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
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
        <DateTimePicker
          value={formData.deadline}
          onChange={(value) => updateFormData({ deadline: value })}
          min={getMinDateTime()}
          placeholder="Select deadline date and time"
          hasError={!isDeadlineValid() && !!formData.deadline}
        />
        {!isDeadlineValid() && formData.deadline && (
          <p className="flex items-center gap-1.5 text-sm text-destructive font-medium">
            <AlertCircle className="w-4 h-4" />
            Deadline must be in the future
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Reminders will be sent at 60, 30, 15, and 1 minute before deadline
        </p>
      </div>

      {/* Schedule Toggle Card */}
      <div
        onClick={() => updateFormData({ isScheduled: !formData.isScheduled })}
        role="switch"
        aria-checked={formData.isScheduled}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            updateFormData({ isScheduled: !formData.isScheduled });
          }
        }}
        className={`
          p-5 rounded-xl cursor-pointer transition-all duration-200
          border-2
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
          ${formData.isScheduled
            ? 'bg-primary/10 dark:bg-primary/15 border-primary shadow-sm dark:shadow-[0_0_15px_rgba(0,255,194,0.1)]'
            : 'bg-secondary dark:bg-muted border-border hover:border-primary/40 hover:bg-secondary-hover dark:hover:bg-muted/80'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
              ${formData.isScheduled
                ? 'bg-primary text-primary-foreground scale-110 shadow-lg dark:shadow-[0_4px_20px_rgba(0,255,194,0.25)]'
                : 'bg-muted dark:bg-secondary text-muted-foreground'
              }
            `}>
              <CalendarClock className="w-6 h-6" />
            </div>
            
            {/* Text */}
            <div>
              <p className={`font-semibold transition-colors ${
                formData.isScheduled 
                  ? 'text-foreground' 
                  : 'text-foreground-secondary'
              }`}>
                Schedule for Later
              </p>
              <p className="text-sm text-muted-foreground">
                Automatically publish at a future date
              </p>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <div className={`
            relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
            ${formData.isScheduled ? 'bg-primary' : 'bg-switch-background'}
          `}>
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out"
              style={{ transform: formData.isScheduled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
            />
          </div>
        </div>

        {/* Schedule Time Input */}
        {formData.isScheduled && (
          <div 
            className="mt-5 pt-5 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <CalendarClock className="w-4 h-4 text-primary" />
              Publish At <span className="text-destructive">*</span>
            </label>
            <DateTimePicker
              value={formData.scheduleTime}
              onChange={(value) => updateFormData({ scheduleTime: value })}
              min={getMinDateTime()}
              max={formData.deadline}
              placeholder="Select publish date and time"
              hasError={!isScheduleTimeValid()}
            />
            {!isScheduleTimeValid() && formData.scheduleTime && (
              <p className="flex items-center gap-1.5 text-sm text-destructive font-medium mt-2">
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
        <div className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <p className="text-sm text-foreground">
            {formData.isScheduled && formData.scheduleTime ? (
              <>
                <span className="font-semibold">Scheduled to publish:</span>{' '}
                <span className="text-foreground-secondary">
                  {new Date(formData.scheduleTime).toLocaleString()}
                </span>
                <br />
              </>
            ) : null}
            <span className="font-semibold">Responses due by:</span>{' '}
            <span className="text-foreground-secondary">
              {new Date(formData.deadline).toLocaleString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
