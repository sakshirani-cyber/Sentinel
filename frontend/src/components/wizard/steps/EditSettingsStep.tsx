import { useEffect } from 'react';
import { EditStepProps, isAnonymityModeChanged, isRepublishRequired, isBufferInsufficient } from '../types';
import { Settings, Eye, EyeOff, Bell, Shield, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

/**
 * EditSettingsStep Component
 * 
 * Edit-specific settings step that includes:
 * - Default response selection (same as SettingsStep)
 * - Show default to recipients toggle
 * - Persistent final alert toggle (with 15-min buffer warning)
 * - Republish toggle (EDIT-SPECIFIC)
 * - Response tracking / Anonymity mode (with republish warning)
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function EditSettingsStep({ formData, updateFormData, onValidationChange }: EditStepProps) {
  const validOptions = formData.options.filter(o => o.trim());
  
  // Edit-specific validations
  const anonymityChanged = isAnonymityModeChanged(formData);
  const republishMissing = isRepublishRequired(formData);
  const bufferInsufficient = isBufferInsufficient(formData);

  // Validate - default response must be set, no republish missing, no buffer issue
  useEffect(() => {
    const hasDefault = formData.useCustomDefault 
      ? formData.customDefault.trim().length > 0
      : formData.defaultResponse.trim().length > 0;
    const isValid = hasDefault && !republishMissing && !bufferInsufficient;
    onValidationChange?.(isValid);
  }, [
    formData.defaultResponse, 
    formData.customDefault, 
    formData.useCustomDefault, 
    republishMissing,
    bufferInsufficient,
    onValidationChange
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Update signal settings
        </h2>
        <p className="text-foreground-secondary">
          Modify defaults and behavior for this signal
        </p>
      </div>

      {/* Default Response Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Default Response <span className="text-destructive">*</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer group">
            <CheckboxSimple
              checked={formData.useCustomDefault}
              onChange={(checked) => updateFormData({ useCustomDefault: checked })}
              size="sm"
            />
            <span className="text-foreground-secondary group-hover:text-foreground transition-colors">
              Custom response
            </span>
          </label>
        </div>

        {formData.useCustomDefault ? (
          <input
            type="text"
            value={formData.customDefault}
            onChange={(e) => updateFormData({ customDefault: e.target.value })}
            placeholder="e.g., No response recorded"
            className="
              w-full px-4 py-3 rounded-xl
              bg-input-background dark:bg-input
              border-2 border-border
              text-foreground
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-4 focus:border-primary focus:ring-ring
              hover:border-foreground-muted
              transition-all duration-200
            "
          />
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={formData.defaultResponse}
              onValueChange={(value) => updateFormData({ defaultResponse: value })}
            >
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select from options..." />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {validOptions.length > 0 ? (
                  validOptions.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No options available. Add options in Step 2.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          This response will be recorded if a recipient doesn't respond before the deadline.
        </p>
      </div>

      {/* Toggle Cards */}
      <div className="space-y-3">
        {/* Show Default to Consumers */}
        <ToggleCard
          icon={formData.showDefaultToConsumers ? Eye : EyeOff}
          title="Show default to recipients"
          description="Recipients will see what response will be recorded if they don't respond"
          checked={formData.showDefaultToConsumers}
          onChange={(checked) => updateFormData({ showDefaultToConsumers: checked })}
        />

        {/* Persistent Final Alert */}
        <ToggleCard
          icon={Bell}
          title="Persistent final alert"
          description="The 1-minute warning will require action before it can be dismissed"
          checked={formData.isPersistentFinalAlert}
          onChange={(checked) => updateFormData({ isPersistentFinalAlert: checked })}
          warning={bufferInsufficient ? "Requires at least 15 minutes notice. Extend deadline." : undefined}
        />

        {/* EDIT-SPECIFIC: Republish Toggle */}
        <ToggleCard
          icon={RefreshCw}
          title="Republish Signal"
          description="Clear all existing responses and notify recipients again"
          checked={formData.republish}
          onChange={(checked) => updateFormData({ republish: checked })}
          variant="warning"
        />
      </div>

      {/* Response Tracking / Anonymity Mode */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Response Tracking
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ResponseTrackingOption
            icon={Shield}
            title="Record Responses"
            description="See who responded with what"
            selected={formData.anonymityMode === 'record'}
            onClick={() => updateFormData({ anonymityMode: 'record' })}
          />
          <ResponseTrackingOption
            icon={EyeOff}
            title="Anonymous"
            description="Responses are not linked to names"
            selected={formData.anonymityMode === 'anonymous'}
            onClick={() => updateFormData({ anonymityMode: 'anonymous' })}
          />
        </div>

        {/* Warning if anonymity changed without republish */}
        {republishMissing && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 dark:bg-destructive/15 border border-destructive/30">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Republish Required
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                You changed Response Tracking mode. Enable "Republish Signal" above to apply this change.
              </p>
            </div>
          </div>
        )}

        {/* Info about anonymity change */}
        {anonymityChanged && !republishMissing && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 dark:bg-warning/15 border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">
                Response Tracking Changed
              </p>
              <p className="text-xs text-warning/80 mt-1">
                All existing responses will be deleted when you save with Republish enabled.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * Simple Checkbox Component
 */
function CheckboxSimple({ 
  checked, 
  onChange, 
  size = 'md' 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        ${sizeClasses} rounded border-2 flex items-center justify-center
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
        ${checked
          ? 'bg-primary border-primary text-primary-foreground'
          : 'bg-transparent border-border hover:border-primary/50'
        }
      `}
    >
      {checked && <Check className="w-3 h-3" />}
    </button>
  );
}

/**
 * ToggleCard - A clickable card with an integrated toggle switch
 */
function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  variant = 'default',
  warning,
}: {
  icon: typeof Eye;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'default' | 'warning';
  warning?: string;
}) {
  const isWarningVariant = variant === 'warning';
  
  return (
    <div>
      <div
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`
          flex items-center gap-4 p-4 rounded-xl cursor-pointer
          border-2 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
          ${checked
            ? isWarningVariant
              ? 'bg-warning/10 dark:bg-warning/15 border-warning shadow-sm'
              : 'bg-primary/10 dark:bg-primary/15 border-primary shadow-sm dark:shadow-[0_0_15px_rgba(0,255,194,0.1)]'
            : 'bg-secondary dark:bg-muted border-border hover:border-primary/40 hover:bg-secondary-hover dark:hover:bg-muted/80'
          }
        `}
      >
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
          ${checked
            ? isWarningVariant
              ? 'bg-warning text-white shadow-md'
              : 'bg-primary text-primary-foreground shadow-md'
            : 'bg-muted dark:bg-secondary text-muted-foreground'
          }
        `}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium transition-colors ${
            checked 
              ? 'text-foreground' 
              : 'text-foreground-secondary'
          }`}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        </div>

        {/* Toggle Switch */}
        <div 
          className={`
            relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
            ${checked 
              ? isWarningVariant ? 'bg-warning' : 'bg-primary' 
              : 'bg-switch-background'
            }
          `}
        >
          <div
            className={`
              absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm 
              transition-transform duration-200 ease-out
            `}
            style={{ 
              transform: checked ? 'translateX(1.375rem)' : 'translateX(0.25rem)' 
            }}
          />
        </div>
      </div>
      
      {/* Warning message below the card */}
      {warning && (
        <p className="flex items-center gap-1.5 text-sm text-destructive font-medium mt-2 ml-2">
          <AlertTriangle className="w-4 h-4" />
          {warning}
        </p>
      )}
    </div>
  );
}

/**
 * ResponseTrackingOption - Selection card for anonymity mode
 */
function ResponseTrackingOption({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200
        border-2 w-full
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
        ${selected
          ? 'bg-primary/10 dark:bg-primary/15 border-primary shadow-md dark:shadow-[0_0_20px_rgba(0,255,194,0.15)]'
          : 'bg-secondary dark:bg-muted border-border hover:border-primary/40 hover:bg-secondary-hover dark:hover:bg-muted/80'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0
        ${selected
          ? 'bg-primary text-primary-foreground shadow-md dark:shadow-[0_4px_20px_rgba(0,255,194,0.25)]'
          : 'bg-muted dark:bg-secondary text-muted-foreground'
        }
      `}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold transition-colors ${
          selected 
            ? 'text-foreground' 
            : 'text-foreground-secondary'
        }`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Selection Indicator */}
      <div className={`
        w-6 h-6 rounded-full flex-shrink-0
        flex items-center justify-center
        border-2 transition-all duration-200
        ${selected
          ? 'bg-primary border-primary text-primary-foreground'
          : 'bg-transparent border-border'
        }
      `}>
        {selected && <Check className="w-3.5 h-3.5" />}
      </div>
    </button>
  );
}
