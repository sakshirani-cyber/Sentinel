import { useEffect } from 'react';
import { StepProps } from '../types';
import { Settings, Eye, EyeOff, Bell, Shield, ChevronDown } from 'lucide-react';

/**
 * Step 3: Settings
 * 
 * Configures signal behavior:
 * - Default response
 * - Anonymity mode
 * - Persistent alert toggle
 * - Show default to consumers
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
        <div className="w-16 h-16 rounded-full bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
        </div>
        <h2 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
          Configure signal settings
        </h2>
        <p className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          Set defaults and behavior for this signal
        </p>
      </div>

      {/* Default Response Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">
            Default Response <span className="text-red-500">*</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={formData.useCustomDefault}
              onChange={(e) => updateFormData({ useCustomDefault: e.target.checked })}
              className="w-4 h-4 rounded border-ribbit-fern/30 text-ribbit-fern focus:ring-ribbit-fern/20"
            />
            <span className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">Custom response</span>
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
              bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30
              border-2 border-ribbit-fern/30 dark:border-ribbit-dry-sage/20
              text-ribbit-pine-teal dark:text-ribbit-dust-grey
              placeholder:text-ribbit-pine-teal/40 dark:placeholder:text-ribbit-dust-grey/40
              focus:outline-none focus:ring-4 focus:border-ribbit-fern focus:ring-ribbit-fern/20
              transition-all duration-200
            "
          />
        ) : (
          <div className="relative">
            <select
              value={formData.defaultResponse}
              onChange={(e) => updateFormData({ defaultResponse: e.target.value })}
              className="
                w-full px-4 py-3 pr-10 rounded-xl appearance-none
                bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30
                border-2 border-ribbit-fern/30 dark:border-ribbit-dry-sage/20
                text-ribbit-pine-teal dark:text-ribbit-dust-grey
                focus:outline-none focus:ring-4 focus:border-ribbit-fern focus:ring-ribbit-fern/20
                transition-all duration-200
                cursor-pointer
              "
            >
              <option value="">Select from options...</option>
              {validOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ribbit-pine-teal/50 pointer-events-none" />
          </div>
        )}
        <p className="text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">
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
        />
      </div>

      {/* Anonymity Mode */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">
          Response Tracking
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnonymityOption
            icon={Shield}
            title="Record Responses"
            description="See who responded with what"
            selected={formData.anonymityMode === 'record'}
            onClick={() => updateFormData({ anonymityMode: 'record' })}
          />
          <AnonymityOption
            icon={EyeOff}
            title="Anonymous"
            description="Responses are not linked to names"
            selected={formData.anonymityMode === 'anonymous'}
            onClick={() => updateFormData({ anonymityMode: 'anonymous' })}
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components

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
      className={`
        flex items-center gap-4 p-4 rounded-xl cursor-pointer
        border-2 transition-all duration-200
        ${checked
          ? 'bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 border-ribbit-fern dark:border-ribbit-dry-sage'
          : 'bg-ribbit-dust-grey/30 dark:bg-ribbit-hunter-green/20 border-ribbit-fern/20 dark:border-ribbit-dry-sage/10 hover:border-ribbit-fern/40'
        }
      `}
    >
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center transition-colors
        ${checked
          ? 'bg-ribbit-fern text-white'
          : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50'
        }
      `}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className={`font-medium transition-colors ${
          checked 
            ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage' 
            : 'text-ribbit-pine-teal dark:text-ribbit-dust-grey'
        }`}>
          {title}
        </p>
        <p className="text-xs text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
          {description}
        </p>
      </div>
      <div className={`
        relative w-11 h-6 rounded-full transition-colors
        ${checked ? 'bg-ribbit-fern' : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50'}
      `}>
        <div
          className={`
            absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </div>
    </div>
  );
}

function AnonymityOption({
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
      onClick={onClick}
      className={`
        p-4 rounded-xl text-left transition-all duration-200
        border-2
        ${selected
          ? 'bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 border-ribbit-fern dark:border-ribbit-dry-sage'
          : 'bg-ribbit-dust-grey/30 dark:bg-ribbit-hunter-green/20 border-ribbit-fern/20 dark:border-ribbit-dry-sage/10 hover:border-ribbit-fern/40'
        }
      `}
    >
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors
        ${selected
          ? 'bg-ribbit-fern text-white'
          : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50'
        }
      `}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={`font-medium ${
        selected 
          ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage' 
          : 'text-ribbit-pine-teal dark:text-ribbit-dust-grey'
      }`}>
        {title}
      </p>
      <p className="text-xs text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 mt-1">
        {description}
      </p>
    </button>
  );
}
