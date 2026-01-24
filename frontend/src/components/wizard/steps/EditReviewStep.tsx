import { useEffect } from 'react';
import { EditStepProps, hasFormChanges } from '../types';
import { 
  ClipboardCheck, AlertTriangle, FileText, ListChecks, Settings, 
  Users, Calendar, Tag, RefreshCw, ArrowRight
} from 'lucide-react';

/**
 * EditReviewStep Component
 * 
 * Shows a summary of all changes made to the signal:
 * - Changed fields with old → new values
 * - Republish warning if enabled
 * - Condensed signal preview
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function EditReviewStep({ formData, updateFormData, onValidationChange }: EditStepProps) {
  const hasChanges = hasFormChanges(formData);
  
  // Calculate what changed
  const questionChanged = formData.question !== formData.originalQuestion;
  const optionsChanged = JSON.stringify(formData.options) !== JSON.stringify(formData.originalOptions);
  const currentDefault = formData.useCustomDefault ? formData.customDefault : formData.defaultResponse;
  const defaultChanged = currentDefault !== formData.originalDefaultResponse;
  const showDefaultChanged = formData.showDefaultToConsumers !== formData.originalShowDefaultToConsumers;
  const anonymityChanged = formData.anonymityMode !== formData.originalAnonymityMode;
  const persistentAlertChanged = formData.isPersistentFinalAlert !== formData.originalPersistentAlert;
  const consumersChanged = JSON.stringify([...formData.consumers].sort()) !== JSON.stringify([...formData.originalConsumers].sort());
  const deadlineChanged = formData.deadline !== formData.originalDeadline;
  const scheduleChanged = formData.pollStatus === 'scheduled' && formData.scheduledFor !== formData.originalScheduledFor;
  const labelsChanged = JSON.stringify([...formData.labels].sort()) !== JSON.stringify([...formData.originalLabels].sort());

  // Count changes
  const changeCount = [
    questionChanged, optionsChanged, defaultChanged, showDefaultChanged,
    anonymityChanged, persistentAlertChanged, consumersChanged,
    deadlineChanged, scheduleChanged, labelsChanged
  ].filter(Boolean).length;

  // Validate - must have changes to proceed
  useEffect(() => {
    onValidationChange?.(hasChanges);
  }, [hasChanges, onValidationChange]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Review your changes
        </h2>
        <p className="text-foreground-secondary">
          {hasChanges 
            ? `${changeCount} ${changeCount === 1 ? 'change' : 'changes'} will be saved`
            : 'No changes detected'
          }
        </p>
      </div>

      {/* Republish Warning */}
      {formData.republish && (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-destructive/10 dark:bg-destructive/15 border-2 border-destructive/30">
          <div className="w-10 h-10 rounded-lg bg-destructive flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-destructive">
              Republish Enabled
            </p>
            <p className="text-sm text-destructive/80 mt-1">
              All existing responses will be permanently deleted. Recipients will be notified to submit new responses.
            </p>
          </div>
        </div>
      )}

      {/* No Changes Warning */}
      {!hasChanges && (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted dark:bg-secondary border border-border">
          <div className="w-10 h-10 rounded-lg bg-muted-foreground/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              No Changes Detected
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Go back and modify the signal to enable saving.
            </p>
          </div>
        </div>
      )}

      {/* Changes Summary */}
      {hasChanges && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">
            Changes Summary
          </h3>
          
          <div className="space-y-2">
            {questionChanged && (
              <ChangeItem
                icon={FileText}
                label="Question"
                oldValue={truncate(formData.originalQuestion, 50)}
                newValue={truncate(formData.question, 50)}
              />
            )}
            
            {optionsChanged && (
              <ChangeItem
                icon={ListChecks}
                label="Options"
                oldValue={`${formData.originalOptions.filter(o => o.trim()).length} options`}
                newValue={`${formData.options.filter(o => o.trim()).length} options`}
              />
            )}
            
            {defaultChanged && (
              <ChangeItem
                icon={Settings}
                label="Default Response"
                oldValue={truncate(formData.originalDefaultResponse, 30)}
                newValue={truncate(currentDefault, 30)}
              />
            )}
            
            {showDefaultChanged && (
              <ChangeItem
                icon={Settings}
                label="Show Default"
                oldValue={formData.originalShowDefaultToConsumers ? 'Visible' : 'Hidden'}
                newValue={formData.showDefaultToConsumers ? 'Visible' : 'Hidden'}
              />
            )}
            
            {anonymityChanged && (
              <ChangeItem
                icon={Settings}
                label="Response Tracking"
                oldValue={formData.originalAnonymityMode === 'record' ? 'Record' : 'Anonymous'}
                newValue={formData.anonymityMode === 'record' ? 'Record' : 'Anonymous'}
                highlight
              />
            )}
            
            {persistentAlertChanged && (
              <ChangeItem
                icon={Settings}
                label="Persistent Alert"
                oldValue={formData.originalPersistentAlert ? 'Enabled' : 'Disabled'}
                newValue={formData.isPersistentFinalAlert ? 'Enabled' : 'Disabled'}
              />
            )}
            
            {consumersChanged && (
              <ChangeItem
                icon={Users}
                label="Recipients"
                oldValue={`${formData.originalConsumers.length} recipients`}
                newValue={`${formData.consumers.length} recipients`}
              />
            )}
            
            {deadlineChanged && (
              <ChangeItem
                icon={Calendar}
                label="Deadline"
                oldValue={formData.originalDeadline 
                  ? new Date(formData.originalDeadline).toLocaleString() 
                  : 'Not set'}
                newValue={formData.deadline 
                  ? new Date(formData.deadline).toLocaleString() 
                  : 'Not set'}
              />
            )}
            
            {scheduleChanged && (
              <ChangeItem
                icon={Calendar}
                label="Publish Time"
                oldValue={formData.originalScheduledFor 
                  ? new Date(formData.originalScheduledFor).toLocaleString() 
                  : 'Not set'}
                newValue={formData.scheduledFor 
                  ? new Date(formData.scheduledFor).toLocaleString() 
                  : 'Not set'}
              />
            )}
            
            {labelsChanged && (
              <ChangeItem
                icon={Tag}
                label="Labels"
                oldValue={formData.originalLabels.length > 0 
                  ? formData.originalLabels.slice(0, 3).join(', ') + (formData.originalLabels.length > 3 ? '...' : '')
                  : 'None'}
                newValue={formData.labels.length > 0 
                  ? formData.labels.slice(0, 3).join(', ') + (formData.labels.length > 3 ? '...' : '')
                  : 'None'}
              />
            )}
          </div>
        </div>
      )}

      {/* Signal Preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">
          Signal Preview
        </h3>
        
        <div className="p-4 rounded-xl bg-secondary dark:bg-muted border border-border">
          <p className="text-sm font-medium text-foreground mb-2">
            {formData.question || 'No question set'}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.options.filter(o => o.trim()).map((option, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20"
              >
                {truncate(option, 20)}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              <Users className="w-3 h-3 inline mr-1" />
              {formData.consumers.length} recipients
            </span>
            <span className="text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 inline mr-1" />
              {formData.deadline 
                ? new Date(formData.deadline).toLocaleDateString() 
                : 'No deadline'}
            </span>
            {formData.labels.length > 0 && (
              <span className="text-xs text-muted-foreground">
                <Tag className="w-3 h-3 inline mr-1" />
                {formData.labels.length} labels
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save Info */}
      {hasChanges && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <ClipboardCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground-secondary">
            Click <strong>Save Changes</strong> to apply your modifications. 
            {formData.republish && ' All existing responses will be deleted.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * ChangeItem - Shows a single change with old → new values
 */
function ChangeItem({
  icon: Icon,
  label,
  oldValue,
  newValue,
  highlight = false,
}: {
  icon: typeof FileText;
  label: string;
  oldValue: string;
  newValue: string;
  highlight?: boolean;
}) {
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg
      ${highlight 
        ? 'bg-warning/10 dark:bg-warning/15 border border-warning/30' 
        : 'bg-secondary dark:bg-muted border border-border'
      }
    `}>
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${highlight 
          ? 'bg-warning/20 text-warning' 
          : 'bg-muted-foreground/10 text-muted-foreground'
        }
      `}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-sm text-muted-foreground line-through">
            {oldValue}
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className={`text-sm font-medium ${highlight ? 'text-warning' : 'text-foreground'}`}>
            {newValue}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Truncate text to a maximum length
 */
function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
