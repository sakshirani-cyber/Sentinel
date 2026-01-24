import { useEffect } from 'react';
import { EditStepProps, formatDateForInput } from '../types';
import { Calendar, Clock, CalendarClock, AlertCircle, Info } from 'lucide-react';
import DateTimePicker from '../../ui/DateTimePicker';

/**
 * EditSchedulingStep Component
 * 
 * Edit-specific scheduling step that includes:
 * - Scheduled Publication Time (only for scheduled polls)
 * - Deadline picker
 * - Summary of timing changes
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function EditSchedulingStep({ formData, updateFormData, onValidationChange }: EditStepProps) {
  // Check if poll is scheduled (can edit schedule time)
  const canEditSchedule = formData.pollStatus === 'scheduled';

  // Get minimum datetime (now)
  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const isDeadlineValid = () => {
    if (!formData.deadline) return false;
    return new Date(formData.deadline) > new Date();
  };

  const isScheduleTimeValid = () => {
    if (!canEditSchedule || !formData.scheduledFor) return true;
    const scheduleDate = new Date(formData.scheduledFor);
    const now = new Date();
    
    if (scheduleDate <= now) return false;
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      if (scheduleDate >= deadlineDate) return false;
    }
    return true;
  };

  // Check if deadline changed
  const deadlineChanged = formData.deadline !== formData.originalDeadline;
  const scheduleChanged = canEditSchedule && formData.scheduledFor !== formData.originalScheduledFor;

  // Validate
  useEffect(() => {
    const deadlineOk = isDeadlineValid();
    const scheduleOk = !canEditSchedule || (formData.scheduledFor ? isScheduleTimeValid() : true);
    onValidationChange?.(deadlineOk && scheduleOk);
  }, [formData.deadline, formData.scheduledFor, canEditSchedule, onValidationChange]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Adjust timing
        </h2>
        <p className="text-foreground-secondary">
          Update deadline{canEditSchedule ? ' and scheduled publish time' : ''}
        </p>
      </div>

      {/* Scheduled Publication Time - Only for scheduled polls */}
      {canEditSchedule && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarClock className="w-4 h-4 text-primary" />
              Scheduled Publish Time <span className="text-destructive">*</span>
            </label>
            {scheduleChanged && (
              <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
                Modified
              </span>
            )}
          </div>
          
          <DateTimePicker
            value={formData.scheduledFor}
            onChange={(value) => updateFormData({ scheduledFor: value, scheduleTime: value })}
            min={getMinDateTime()}
            max={formData.deadline}
            placeholder="Select publish date and time"
            hasError={!isScheduleTimeValid() && !!formData.scheduledFor}
          />
          
          {!isScheduleTimeValid() && formData.scheduledFor && (
            <p className="flex items-center gap-1.5 text-sm text-destructive font-medium">
              <AlertCircle className="w-4 h-4" />
              {new Date(formData.scheduledFor) <= new Date()
                ? 'Schedule time must be in the future'
                : 'Schedule time must be before the deadline'}
            </p>
          )}
          
          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground-secondary">
              This signal is scheduled. The publish time can only be edited before it goes live.
            </p>
          </div>
        </div>
      )}

      {/* Deadline Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Response Deadline <span className="text-destructive">*</span>
          </label>
          {deadlineChanged && (
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
              Modified
            </span>
          )}
        </div>
        
        <DateTimePicker
          value={formData.deadline}
          onChange={(value) => updateFormData({ deadline: value })}
          min={canEditSchedule && formData.scheduledFor 
            ? formData.scheduledFor 
            : getMinDateTime()
          }
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

      {/* Summary showing changes */}
      {(deadlineChanged || scheduleChanged) && formData.deadline && isDeadlineValid() && (
        <div className="p-4 rounded-xl bg-warning/5 dark:bg-warning/10 border border-warning/20">
          <p className="text-sm font-medium text-foreground mb-2">Timing Changes</p>
          
          {scheduleChanged && canEditSchedule && formData.scheduledFor && (
            <div className="flex items-center gap-2 text-sm mb-1">
              <CalendarClock className="w-4 h-4 text-warning" />
              <span className="text-foreground-secondary">Publish:</span>
              <span className="line-through text-muted-foreground">
                {formData.originalScheduledFor 
                  ? new Date(formData.originalScheduledFor).toLocaleString() 
                  : 'Not set'}
              </span>
              <span className="text-foreground font-medium">
                → {new Date(formData.scheduledFor).toLocaleString()}
              </span>
            </div>
          )}
          
          {deadlineChanged && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-foreground-secondary">Deadline:</span>
              <span className="line-through text-muted-foreground">
                {formData.originalDeadline 
                  ? new Date(formData.originalDeadline).toLocaleString() 
                  : 'Not set'}
              </span>
              <span className="text-foreground font-medium">
                → {new Date(formData.deadline).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Current timing summary (when no changes) */}
      {!deadlineChanged && !scheduleChanged && formData.deadline && isDeadlineValid() && (
        <div className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <p className="text-sm text-foreground">
            {canEditSchedule && formData.scheduledFor ? (
              <>
                <span className="font-semibold">Scheduled to publish:</span>{' '}
                <span className="text-foreground-secondary">
                  {new Date(formData.scheduledFor).toLocaleString()}
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
