import { useEffect } from 'react';
import { StepProps } from '../types';
import { Settings, Eye, EyeOff, Bell, Shield, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { CheckboxSimple } from '../../ui/Checkbox';

/**
 * Step 3: Settings
 * 
 * Configures signal behavior:
 * - Default response
 * - Anonymity mode (Response Tracking)
 * - Persistent alert toggle
 * - Show default to consumers
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function SettingsStep({ formData, updateFormData, onValidationChange }: StepProps) {
  const validOptions = formData.options.filter(o => o.trim());

  // Validate - default response must be set
  useEffect(() => {
    const hasDefault = formData.useCustomDefault 
      ? formData.customDefault.trim().length > 0
      : formData.defaultResponse.trim().length > 0;
    onValidationChange?.(hasDefault);
  }, [formData.defaultResponse, formData.customDefault, formData.useCustomDefault, onValidationChange]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Configure signal settings
        </h2>
        <p className="text-foreground-secondary">
          Set defaults and behavior for this signal
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
          description="The 15-minute warning will require action before it can be dismissed"
          checked={formData.isPersistentFinalAlert}
          onChange={(checked) => updateFormData({ isPersistentFinalAlert: checked })}
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
            onClick={() => {
              // When anonymous is selected, showIndividualResponses must be false
              updateFormData({ 
                anonymityMode: 'anonymous',
                showIndividualResponses: false 
              });
            }}
          />
        </div>

        {/* Show Individual Responses Toggle - Only visible when record mode is selected */}
        {formData.anonymityMode === 'record' && (
          <div className="space-y-3">
            <ToggleCard
              icon={Eye}
              title="Show individual responses"
              description="Allow recipients to see who responded with what in results"
              checked={formData.showIndividualResponses ?? true}
              onChange={(checked) => updateFormData({ showIndividualResponses: checked })}
            />
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
 * ToggleCard - A clickable card with an integrated toggle switch
 * Uses semantic tokens for consistent theming
 */
function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: typeof Eye;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
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
          ? 'bg-primary/10 dark:bg-primary/15 border-primary shadow-sm dark:shadow-[0_0_15px_rgba(0,255,194,0.1)]'
          : 'bg-secondary dark:bg-muted border-border hover:border-primary/40 hover:bg-secondary-hover dark:hover:bg-muted/80'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
        ${checked
          ? 'bg-primary text-primary-foreground shadow-md'
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
          ${checked ? 'bg-primary' : 'bg-switch-background'}
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
  );
}

/**
 * ResponseTrackingOption - Selection card for anonymity mode
 * Horizontal layout with radio-style selection indicator on the right
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

      {/* Selection Indicator - Radio style on right */}
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
