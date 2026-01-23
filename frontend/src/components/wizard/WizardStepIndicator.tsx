import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface WizardStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  completedSteps: Set<number>;
}

/**
 * WizardStepIndicator Component
 * 
 * Displays progress through wizard steps with:
 * - Visual step indicators
 * - Completion checkmarks
 * - Clickable navigation (for completed steps)
 */
export default function WizardStepIndicator({
  steps,
  currentStep,
  onStepClick,
  completedSteps,
}: WizardStepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/30" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-ribbit-fern dark:bg-ribbit-dry-sage transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            const isClickable = (isCompleted || isPast) && onStepClick;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center group
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {/* Step Circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    font-semibold text-sm
                    transition-all duration-300
                    ${isCompleted
                      ? 'bg-ribbit-fern text-white shadow-md'
                      : isCurrent
                        ? 'bg-ribbit-hunter-green text-ribbit-dust-grey shadow-lg scale-110'
                        : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-hunter-green/50 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50'
                    }
                    ${isClickable ? 'hover:scale-110' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step Title - Hidden on mobile, shown on larger screens */}
                <div className="hidden sm:block mt-2 text-center">
                  <p
                    className={`
                      text-xs font-medium transition-colors
                      ${isCurrent
                        ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage'
                        : isCompleted
                          ? 'text-ribbit-fern dark:text-ribbit-dry-sage'
                          : 'text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50'
                      }
                    `}
                  >
                    {step.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Step Info - Mobile */}
      <div className="sm:hidden mt-4 text-center">
        <p className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">
          Step {currentStep + 1}: {steps[currentStep]?.title}
        </p>
        <p className="text-xs text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          {steps[currentStep]?.description}
        </p>
      </div>
    </div>
  );
}
