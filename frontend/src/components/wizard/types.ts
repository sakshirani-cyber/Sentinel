// Create Signal Wizard Types

export interface SignalFormData {
  // Step 1: Basic Info
  question: string;
  description?: string;
  
  // Step 2: Options
  options: string[];
  
  // Step 3: Settings
  defaultResponse: string;
  customDefault: string;
  useCustomDefault: boolean;
  showDefaultToConsumers: boolean;
  anonymityMode: 'anonymous' | 'record';
  isPersistentFinalAlert: boolean;
  
  // Step 4: Recipients
  consumers: string[];
  
  // Step 5: Scheduling
  deadline: string;
  isScheduled: boolean;
  scheduleTime: string;
  
  // Step 6: Labels
  labels: string[];
}

export interface StepProps {
  formData: SignalFormData;
  updateFormData: (updates: Partial<SignalFormData>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
}

export const initialFormData: SignalFormData = {
  question: '',
  description: '',
  options: ['', ''],
  defaultResponse: '',
  customDefault: '',
  useCustomDefault: false,
  showDefaultToConsumers: false,
  anonymityMode: 'record',
  isPersistentFinalAlert: false,
  consumers: [],
  deadline: '',
  isScheduled: false,
  scheduleTime: '',
  labels: [],
};
