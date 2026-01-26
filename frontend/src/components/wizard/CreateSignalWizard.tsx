import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Send, CalendarClock, Loader2 } from 'lucide-react';
import { Poll, User } from '../../types';
import { SignalFormData, initialFormData } from './types';
import WizardStepIndicator from './WizardStepIndicator';
import {
  BasicInfoStep,
  OptionsStep,
  SettingsStep,
  RecipientsStep,
  SchedulingStep,
  LabelsStep,
  ReviewStep,
} from './steps';
import { parseLabelsFromText, formatLabelName } from '../../utils/labelUtils';

// Step definitions
const STEPS = [
  { id: 'basic', title: 'Question', description: 'What are you asking?' },
  { id: 'options', title: 'Options', description: 'Answer choices' },
  { id: 'settings', title: 'Settings', description: 'Configure behavior' },
  { id: 'recipients', title: 'Recipients', description: 'Who receives this?' },
  { id: 'scheduling', title: 'Timing', description: 'When is it due?' },
  { id: 'labels', title: 'Labels', description: 'Organize with labels' },
  { id: 'review', title: 'Review', description: 'Final check' },
];

interface CreateSignalWizardProps {
  user: User;
  onCreatePoll: (poll: Poll) => Promise<void>;
  onClose: () => void;
}

/**
 * CreateSignalWizard Component
 * 
 * Multi-step wizard for creating signals with:
 * - 7 steps covering all signal configuration
 * - Step-by-step validation
 * - Back/Next navigation
 * - Progress indicator
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
 */
export default function CreateSignalWizard({
  user,
  onCreatePoll,
  onClose,
}: CreateSignalWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SignalFormData>(initialFormData);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data
  const updateFormData = useCallback((updates: Partial<SignalFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle validation change from step
  const handleValidationChange = useCallback((isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [currentStep]: isValid }));
  }, [currentStep]);

  // Navigation
  const canGoBack = currentStep > 0;
  const canGoNext = stepValidation[currentStep] !== false;
  const isLastStep = currentStep === STEPS.length - 1;

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
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const goBack = () => {
    if (canGoBack) {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  // Submit the signal
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Gather all labels
      const detectedLabels = [
        ...parseLabelsFromText(formData.question),
        ...formData.options.flatMap(o => parseLabelsFromText(o)),
      ];
      const allLabels = [...new Set([...detectedLabels, ...formData.labels])];

      const poll: Poll = {
        id: `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        publisherEmail: user.email,
        publisherName: user.name,
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
        publishedAt: new Date().toISOString(),
        status: formData.isScheduled ? 'scheduled' : 'active',
        isPersistentAlert: false,
        alertBeforeMinutes: 15,
        scheduledFor: formData.isScheduled ? new Date(formData.scheduleTime).toISOString() : undefined,
        labels: allLabels.map(formatLabelName),
      };

      await onCreatePoll(poll);
      onClose();
    } catch (error) {
      console.error('Error creating poll:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      onValidationChange: handleValidationChange,
    };

    switch (currentStep) {
      case 0:
        return <BasicInfoStep {...stepProps} />;
      case 1:
        return <OptionsStep {...stepProps} />;
      case 2:
        return <SettingsStep {...stepProps} />;
      case 3:
        return <RecipientsStep {...stepProps} />;
      case 4:
        return <SchedulingStep {...stepProps} />;
      case 5:
        return <LabelsStep {...stepProps} />;
      case 6:
        return <ReviewStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Step Indicator */}
      <div className="flex-shrink-0 px-6 pt-6">
        <WizardStepIndicator
          steps={STEPS}
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
            Step {currentStep + 1} of {STEPS.length}
          </span>

          {/* Next/Submit Button */}
          <button
            onClick={goNext}
            disabled={!canGoNext || isSubmitting}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-200 shadow-md
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
              ${isLastStep
                ? 'bg-success text-white hover:bg-success/90 dark:shadow-[0_4px_20px_rgba(16,185,129,0.25)]'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover dark:shadow-[0_4px_20px_rgba(0,255,194,0.2)]'
              }
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-md
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {formData.isScheduled ? 'Scheduling...' : 'Publishing...'}
              </>
            ) : isLastStep ? (
              <>
                {formData.isScheduled ? (
                  <>
                    <CalendarClock className="w-4 h-4" />
                    Schedule
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish
                  </>
                )}
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
