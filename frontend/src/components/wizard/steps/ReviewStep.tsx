import { useEffect } from 'react';
import { StepProps } from '../types';
import { 
  FileText, 
  ListChecks, 
  Settings, 
  Users, 
  Calendar, 
  Tag,
  Check,
  Eye,
  EyeOff,
  Bell,
  Shield,
  CalendarClock
} from 'lucide-react';
import { stripLabelMarkers } from '../../../utils/labelUtils';

/**
 * Step 7: Review
 * 
 * Final review before publishing:
 * - Summary of all settings
 * - Validation checks
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function ReviewStep({ formData, updateFormData, onValidationChange }: StepProps) {
  // Always valid on review step (all validation done in previous steps)
  useEffect(() => {
    onValidationChange?.(true);
  }, [onValidationChange]);

  const validOptions = formData.options.filter(o => o.trim());
  const defaultDisplay = formData.useCustomDefault ? formData.customDefault : formData.defaultResponse;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-success/15 dark:bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Ready to publish?
        </h2>
        <p className="text-foreground-secondary">
          Review your signal before sending it out
        </p>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {/* Question */}
        <ReviewSection
          icon={FileText}
          title="Question"
          content={
            <div>
              <p className="font-medium text-foreground">
                {formData.question}
              </p>
              {formData.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.description}
                </p>
              )}
            </div>
          }
        />

        {/* Options */}
        <ReviewSection
          icon={ListChecks}
          title={`Options (${validOptions.length})`}
          content={
            <div className="space-y-1.5">
              {validOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground-secondary">
                    {option}
                  </span>
                  {option === defaultDisplay && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          }
        />

        {/* Settings */}
        <ReviewSection
          icon={Settings}
          title="Settings"
          content={
            <div className="grid grid-cols-2 gap-3">
              <SettingItem
                icon={formData.anonymityMode === 'anonymous' ? EyeOff : Shield}
                label={formData.anonymityMode === 'anonymous' ? 'Anonymous' : 'Recorded'}
              />
              {formData.showDefaultToConsumers && (
                <SettingItem icon={Eye} label="Default visible" />
              )}
              {formData.isPersistentFinalAlert && (
                <SettingItem icon={Bell} label="Persistent alert" />
              )}
            </div>
          }
        />

        {/* Recipients */}
        <ReviewSection
          icon={Users}
          title={`Recipients (${formData.consumers.length})`}
          content={
            <div className="max-h-24 overflow-y-auto">
              <p className="text-sm text-foreground-secondary">
                {formData.consumers.slice(0, 5).join(', ')}
                {formData.consumers.length > 5 && (
                  <span className="text-muted-foreground">
                    {' '}and {formData.consumers.length - 5} more...
                  </span>
                )}
              </p>
            </div>
          }
        />

        {/* Schedule */}
        <ReviewSection
          icon={formData.isScheduled ? CalendarClock : Calendar}
          title="Timing"
          content={
            <div className="space-y-1.5 text-sm">
              {formData.isScheduled && formData.scheduleTime && (
                <p className="text-foreground-secondary">
                  <span className="text-muted-foreground">Publishes: </span>
                  <span className="text-foreground font-medium">
                    {new Date(formData.scheduleTime).toLocaleString()}
                  </span>
                </p>
              )}
              <p className="text-foreground-secondary">
                <span className="text-muted-foreground">Deadline: </span>
                <span className="text-foreground font-medium">
                  {new Date(formData.deadline).toLocaleString()}
                </span>
              </p>
            </div>
          }
        />

        {/* Labels */}
        {formData.labels.length > 0 && (
          <ReviewSection
            icon={Tag}
            title={`Labels (${formData.labels.length})`}
            content={
              <div className="flex flex-wrap gap-1.5">
                {formData.labels.map(label => (
                  <span
                    key={label}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary/15 text-primary"
                  >
                    {stripLabelMarkers(label)}
                  </span>
                ))}
              </div>
            }
          />
        )}
      </div>

      {/* Final Note */}
      <div className="p-4 rounded-xl bg-success/10 dark:bg-success/15 border border-success/30 text-center">
        <p className="text-sm text-foreground font-medium">
          {formData.isScheduled
            ? 'Click "Schedule" to queue this signal for later.'
            : 'Click "Publish" to send this signal immediately.'}
        </p>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function ReviewSection({
  icon: Icon,
  title,
  content,
}: {
  icon: typeof FileText;
  title: string;
  content: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-secondary dark:bg-muted border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>
      </div>
      {content}
    </div>
  );
}

function SettingItem({
  icon: Icon,
  label,
}: {
  icon: typeof Shield;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-foreground-secondary">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <span>{label}</span>
    </div>
  );
}
