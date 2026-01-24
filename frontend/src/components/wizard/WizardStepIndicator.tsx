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
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
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
        {/* Background Track */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
        
        {/* Progress Fill - Gradient from primary to accent */}
        <div 
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        
        {/* Step Buttons */}
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
                  focus:outline-none
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
                      ? 'bg-primary text-primary-foreground shadow-md dark:shadow-[0_2px_10px_rgba(0,255,194,0.3)]'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground shadow-lg scale-110 dark:shadow-[0_4px_15px_rgba(0,255,194,0.4)]'
                        : 'bg-muted text-muted-foreground'
                    }
                    ${isClickable ? 'hover:scale-110 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background' : ''}
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
                        ? 'text-foreground'
                        : isCompleted
                          ? 'text-primary'
                          : 'text-muted-foreground'
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
        <p className="text-sm font-semibold text-foreground">
          Step {currentStep + 1}: {steps[currentStep]?.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {steps[currentStep]?.description}
        </p>
      </div>
    </div>
  );
}
