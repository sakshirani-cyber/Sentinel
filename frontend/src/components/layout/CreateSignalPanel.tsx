import { useEffect, useCallback, ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useLayout } from './LayoutContext';

interface CreateSignalPanelProps {
  children?: ReactNode;
  title?: string;
  currentStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
}

/**
 * CreateSignalPanel Component
 * 
 * Right-side sliding panel for creating signals.
 * Features:
 * - Slides in from right, stops aligned with sidebar
 * - Semi-transparent backdrop over main content only
 * - Close handlers: X button, ESC key, backdrop click
 * - Optional multi-step navigation
 * - Unsaved changes warning on close
 */
export default function CreateSignalPanel({
  children,
  title = 'Create Signal',
  currentStep = 1,
  totalSteps = 1,
  onStepChange,
  onSubmit,
  isSubmitting = false,
  canProceed = true,
}: CreateSignalPanelProps) {
  const { 
    isCreatePanelOpen, 
    closeCreatePanel, 
    panelHasChanges, 
    setPanelHasChanges 
  } = useLayout();

  // Handle close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (panelHasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) return;
    }
    closeCreatePanel();
  }, [panelHasChanges, closeCreatePanel]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCreatePanelOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCreatePanelOpen, handleClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isCreatePanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCreatePanelOpen]);

  const handleBack = () => {
    if (currentStep > 1 && onStepChange) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && onStepChange) {
      onStepChange(currentStep + 1);
    } else if (currentStep === totalSteps && onSubmit) {
      onSubmit();
    }
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`ribbit-panel-backdrop ${isCreatePanelOpen ? 'open' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`ribbit-panel ${isCreatePanelOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="ribbit-panel-header">
          <div className="flex items-center gap-3">
            <h2 className="ribbit-panel-title">{title}</h2>
            {totalSteps > 1 && (
              <span className="text-base text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        {totalSteps > 1 && (
          <div className="px-6 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center">
                  {/* Step Circle */}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      text-base font-medium transition-colors
                      ${index + 1 < currentStep 
                        ? 'bg-ribbit-fern text-white' 
                        : index + 1 === currentStep
                          ? 'bg-ribbit-fern/20 text-ribbit-fern border-2 border-ribbit-fern'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index + 1 < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {/* Connector Line */}
                  {index < totalSteps - 1 && (
                    <div
                      className={`
                        w-8 h-0.5 mx-1
                        ${index + 1 < currentStep 
                          ? 'bg-ribbit-fern' 
                          : 'bg-border'
                        }
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="ribbit-panel-content">
          {children}
        </div>

        {/* Footer */}
        <div className="ribbit-panel-footer">
          {/* Back Button */}
          {totalSteps > 1 && currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="
                flex items-center gap-2 px-4 py-2.5
                text-foreground rounded-lg
                font-medium text-base
                hover:bg-muted
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Cancel Button */}
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="
              px-4 py-2.5
              text-muted-foreground rounded-lg
              font-medium text-base
              hover:text-foreground hover:bg-muted
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>

          {/* Next/Submit Button */}
          <button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="
              flex items-center gap-2 px-5 py-2.5
              bg-ribbit-hunter-green text-ribbit-dust-grey rounded-lg
              font-medium text-base
              shadow-md
              hover:bg-[#2f4a35] hover:shadow-lg hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
              focus-visible:outline-2 focus-visible:outline-ribbit-hunter-green focus-visible:outline-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:hover:scale-100
            "
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isLastStep ? 'Publishing...' : 'Loading...'}
              </>
            ) : isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Publish
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
