import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { Poll } from '../../types';
import { 
  EditSignalFormData, 
  initializeEditFormData, 
  hasFormChanges,
  isRepublishRequired,
  isBufferInsufficient,
} from './types';
import WizardStepIndicator from './WizardStepIndicator';
import {
  BasicInfoStep,
  OptionsStep,
  RecipientsStep,
  LabelsStep,
  EditSettingsStep,
  EditSchedulingStep,
  EditReviewStep,
} from './steps';
import { parseLabelsFromText, formatLabelName } from '../../utils/labelUtils';

// Step definitions for Edit wizard
const EDIT_STEPS = [
  { id: 'basic', title: 'Question', description: 'Edit your question' },
  { id: 'options', title: 'Options', description: 'Modify choices' },
  { id: 'settings', title: 'Settings', description: 'Update behavior' },
  { id: 'recipients', title: 'Recipients', description: 'Change recipients' },
  { id: 'scheduling', title: 'Timing', description: 'Adjust deadline' },
  { id: 'labels', title: 'Labels', description: 'Update labels' },
  { id: 'review', title: 'Review', description: 'Confirm changes' },
];

interface EditSignalWizardProps {
  poll: Poll;
  onUpdate: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
  onClose: () => void;
}

/**
 * EditSignalWizard Component
 * 
 * Multi-step wizard for editing signals with:
 * - 7 steps matching CreateSignalWizard UI/UX
 * - Step-by-step validation
 * - Back/Next navigation with breadcrumb progress
 * - Preserves all Edit-specific logic (republish, validations)
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function EditSignalWizard({
  poll,
  onUpdate,
  onClose,
}: EditSignalWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EditSignalFormData>(() => 
    initializeEditFormData(poll)
  );
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data
  const updateFormData = useCallback((updates: Partial<EditSignalFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle validation change from step
  const handleValidationChange = useCallback((isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [currentStep]: isValid }));
  }, [currentStep]);

  // Edit-specific validations
  const hasChanges = useMemo(() => hasFormChanges(formData), [formData]);
  const republishMissing = useMemo(() => isRepublishRequired(formData), [formData]);
  const bufferInsufficient = useMemo(() => isBufferInsufficient(formData), [formData]);

  // Navigation
  const canGoBack = currentStep > 0;
  const canGoNext = stepValidation[currentStep] !== false;
  const isLastStep = currentStep === EDIT_STEPS.length - 1;

  // Final validation for save
  const canSave = hasChanges && !republishMissing && !bufferInsufficient;

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex);
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, EDIT_STEPS.length - 1));
    }
  };

  const goBack = () => {
    if (canGoBack) {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  // Submit the changes
  const handleSubmit = async () => {
    if (!canSave) return;
    
    setIsSubmitting(true);
    console.log('[EditSignalWizard] Starting save for poll:', poll.id);

    try {
      // Gather all labels (detected + explicit)
      const detectedLabels = [
        ...parseLabelsFromText(formData.question),
        ...formData.options.flatMap(o => parseLabelsFromText(o)),
      ];
      const allLabels = [...new Set([...detectedLabels, ...formData.labels])];

      // Build updates object
      const updates: Partial<Poll> = {
        title: formData.title?.trim() || formData.question.trim(), // Use title if provided, otherwise fallback to question
        question: formData.question,
        options: formData.options.filter(o => o.trim()).map((text, index) => ({
          id: `opt-${index}`,
          text: text.trim(),
        })),
        defaultResponse: formData.useCustomDefault ? formData.customDefault : formData.defaultResponse,
        showDefaultToConsumers: formData.showDefaultToConsumers,
        anonymityMode: formData.anonymityMode,
        deadline: new Date(formData.deadline).toISOString(),
        isPersistentFinalAlert: formData.isPersistentFinalAlert,
        consumers: formData.consumers,
        labels: allLabels.map(formatLabelName),
        isEdited: true,
      };

      // Include scheduledFor only if poll is scheduled
      if (formData.pollStatus === 'scheduled' && formData.scheduledFor) {
        updates.scheduledFor = new Date(formData.scheduledFor).toISOString();
      }

      console.log('[EditSignalWizard] Saving updates:', { 
        updates, 
        republish: formData.republish,
        hasChanges 
      });

      await onUpdate(poll.id, updates, formData.republish);
      console.log('[EditSignalWizard] Save completed successfully');
      onClose();
    } catch (error) {
      console.error('[EditSignalWizard] Error saving poll:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    // Steps 0, 1, 3, 5 reuse Create components (they work with SignalFormData)
    // Steps 2, 4, 6 use Edit-specific components (they need EditSignalFormData)
    const baseStepProps = {
      formData,
      updateFormData,
      onValidationChange: handleValidationChange,
    };

    switch (currentStep) {
      case 0: // Question - reuse BasicInfoStep
        return <BasicInfoStep {...baseStepProps} />;
      case 1: // Options - reuse OptionsStep
        return <OptionsStep {...baseStepProps} />;
      case 2: // Settings - use EditSettingsStep (has Republish)
        return <EditSettingsStep {...baseStepProps} />;
      case 3: // Recipients - reuse RecipientsStep
        return <RecipientsStep {...baseStepProps} />;
      case 4: // Timing - use EditSchedulingStep (has schedule editing)
        return <EditSchedulingStep {...baseStepProps} />;
      case 5: // Labels - reuse LabelsStep
        return <LabelsStep {...baseStepProps} />;
      case 6: // Review - use EditReviewStep (shows changes)
        return <EditReviewStep {...baseStepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Step Indicator */}
      <div className="flex-shrink-0 px-6 pt-6">
        <WizardStepIndicator
          steps={EDIT_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {renderStep()}
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-secondary dark:bg-muted">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={goBack}
            disabled={!canGoBack || isSubmitting}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-xl 
              text-sm font-medium 
              text-foreground-secondary
              hover:bg-muted dark:hover:bg-secondary 
              hover:text-foreground
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
            "
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Step Counter */}
          <span className="text-sm text-muted-foreground font-medium">
            Step {currentStep + 1} of {EDIT_STEPS.length}
          </span>

          {/* Next/Save Button */}
          <button
            onClick={goNext}
            disabled={!canGoNext || isSubmitting || (isLastStep && !canSave)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-200 shadow-md
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
              ${isLastStep
                ? 'bg-primary text-primary-foreground hover:bg-primary-hover dark:shadow-[0_4px_20px_rgba(0,255,194,0.2)]'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover dark:shadow-[0_4px_20px_rgba(0,255,194,0.2)]'
              }
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-md
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isLastStep ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
