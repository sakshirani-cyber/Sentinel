// Create Signal Wizard Types
import { Poll } from '../../types';
import { stripLabelMarkers } from '../../utils/labelUtils';

export interface SignalFormData {
  // Step 1: Basic Info
  title?: string; // Optional title for the signal
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

/**
 * Edit Signal Form Data - extends SignalFormData with edit-specific fields
 */
export interface EditSignalFormData extends SignalFormData {
  // Edit-specific fields
  republish: boolean;
  
  // Original values for change detection
  originalQuestion: string;
  originalOptions: string[];
  originalAnonymityMode: 'anonymous' | 'record';
  originalDeadline: string;
  originalPersistentAlert: boolean;
  originalShowDefaultToConsumers: boolean;
  originalDefaultResponse: string;
  originalConsumers: string[];
  originalLabels: string[];
  originalScheduledFor: string;
  
  // Poll metadata
  pollId: string;
  pollStatus: 'active' | 'scheduled' | 'completed';
  scheduledFor: string; // For scheduled polls
}

export interface StepProps {
  formData: SignalFormData;
  updateFormData: (updates: Partial<SignalFormData>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * Edit Step Props - extends StepProps with edit-specific data
 */
export interface EditStepProps {
  formData: EditSignalFormData;
  updateFormData: (updates: Partial<EditSignalFormData>) => void;
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
  title: '',
  scheduleTime: '',
  labels: [],
};

/**
 * Helper function to format date for datetime-local input
 */
export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Initialize EditSignalFormData from a Poll object
 */
export function initializeEditFormData(poll: Poll): EditSignalFormData {
  const isOptionDefault = poll.options.some(o => o.text === poll.defaultResponse);
  const formattedDeadline = formatDateForInput(poll.deadline);
  const formattedScheduledFor = formatDateForInput(poll.scheduledFor || '');
  const optionTexts = poll.options.map(o => o.text);
  const labelNames = (poll.labels || []).map(stripLabelMarkers);
  
  return {
    // Basic Info
    title: poll.title,
    question: poll.question,
    description: '',
    
    // Options
    options: optionTexts,
    
    // Settings
    defaultResponse: isOptionDefault ? poll.defaultResponse : '',
    customDefault: isOptionDefault ? '' : poll.defaultResponse,
    useCustomDefault: !isOptionDefault,
    showDefaultToConsumers: poll.showDefaultToConsumers,
    anonymityMode: poll.anonymityMode,
    isPersistentFinalAlert: poll.isPersistentFinalAlert,
    
    // Recipients
    consumers: [...poll.consumers],
    
    // Scheduling
    deadline: formattedDeadline,
    isScheduled: poll.status === 'scheduled',
    scheduleTime: formattedScheduledFor,
    
    // Labels
    labels: labelNames,
    
    // Edit-specific
    republish: false,
    
    // Original values for change detection
    originalQuestion: poll.question,
    originalOptions: optionTexts,
    originalAnonymityMode: poll.anonymityMode,
    originalDeadline: formattedDeadline,
    originalPersistentAlert: poll.isPersistentFinalAlert,
    originalShowDefaultToConsumers: poll.showDefaultToConsumers,
    originalDefaultResponse: poll.defaultResponse,
    originalConsumers: [...poll.consumers],
    originalLabels: labelNames,
    originalScheduledFor: formattedScheduledFor,
    
    // Poll metadata
    pollId: poll.id,
    pollStatus: poll.status as 'active' | 'scheduled' | 'completed',
    scheduledFor: formattedScheduledFor,
  };
}

/**
 * Detect if any changes were made to the form
 */
export function hasFormChanges(formData: EditSignalFormData): boolean {
  const currentDefault = formData.useCustomDefault ? formData.customDefault : formData.defaultResponse;
  
  return (
    formData.question !== formData.originalQuestion ||
    JSON.stringify(formData.options) !== JSON.stringify(formData.originalOptions) ||
    currentDefault !== formData.originalDefaultResponse ||
    formData.showDefaultToConsumers !== formData.originalShowDefaultToConsumers ||
    formData.anonymityMode !== formData.originalAnonymityMode ||
    formData.deadline !== formData.originalDeadline ||
    formData.isPersistentFinalAlert !== formData.originalPersistentAlert ||
    JSON.stringify([...formData.consumers].sort()) !== JSON.stringify([...formData.originalConsumers].sort()) ||
    JSON.stringify([...formData.labels].sort()) !== JSON.stringify([...formData.originalLabels].sort()) ||
    (formData.pollStatus === 'scheduled' && formData.scheduledFor !== formData.originalScheduledFor)
  );
}

/**
 * Check if anonymity mode was changed
 */
export function isAnonymityModeChanged(formData: EditSignalFormData): boolean {
  return formData.anonymityMode !== formData.originalAnonymityMode;
}

/**
 * Check if republish is required but not enabled
 */
export function isRepublishRequired(formData: EditSignalFormData): boolean {
  return isAnonymityModeChanged(formData) && !formData.republish;
}

/**
 * Check if buffer is insufficient for persistent alert
 */
export function isBufferInsufficient(formData: EditSignalFormData): boolean {
  if (!formData.originalPersistentAlert && formData.isPersistentFinalAlert) {
    if (!formData.deadline) return false;
    const now = new Date();
    const deadline = new Date(formData.deadline);
    const minutesUntilDeadline = (deadline.getTime() - now.getTime()) / 60000;
    return minutesUntilDeadline < 15;
  }
  return false;
}
