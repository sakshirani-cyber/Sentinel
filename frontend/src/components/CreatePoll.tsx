import { useState, useEffect } from 'react';
import { User, Poll } from '../App';
import { Plus, X, Eye, Check, Upload, Loader2, CalendarClock } from 'lucide-react';
import * as XLSX from 'xlsx';
import PollPreview from './PollPreview';
import { cn } from './ui/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseLabelsFromText, stripLabelMarkers, parseLabelName, formatLabelName } from '../utils/labelUtils';
import LabelInput from './LabelInput';
import LabelText from './LabelText';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface CreatePollProps {
  user: User;
  onCreatePoll: (poll: Poll) => void;
  existingPolls: Poll[];
  formType?: string;
}

export default function CreatePoll({ user, onCreatePoll }: CreatePollProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [defaultResponse, setDefaultResponse] = useState('');
  const [customDefault, setCustomDefault] = useState('');
  const [useCustomDefault, setUseCustomDefault] = useState(false);
  const [showDefaultToConsumers, setShowDefaultToConsumers] = useState(false);
  const [anonymityMode, setAnonymityMode] = useState<'anonymous' | 'record'>('record');
  const [deadline, setDeadline] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPersistentFinalAlert, setIsPersistentFinalAlert] = useState(false);
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; new: number } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [explicitLabels, setExplicitLabels] = useState<string[]>([]);

  // Fetch labels on mount
  useEffect(() => {
    const fetchLabels = async () => {
      if ((window as any).electron?.db) {
        try {
          const result = await (window as any).electron.db.getLabels();
          setLabels(result.success ? result.data : []);
        } catch (error) {
          console.error('Failed to fetch labels:', error);
        }
      }
    };
    fetchLabels();
  }, []);

  // Set minimum datetime to current time
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  // Mock consumers list - in real app, this would come from backend
  const availableConsumers = Array.from(new Set([
    "consumer1@test.com",
    "consumer2@test.com",
    "consumer3@test.com",
    "consumer4@test.com",
    "consumer5@test.com",
    "consumer6@test.com",
    "consumer7@test.com",
    "consumer8@test.com",
    "consumer9@test.com",
    "consumer10@test.com",
    "publisher1@test.com",
    "publisher2@test.com",
    "publisher3@test.com",
    "publisher4@test.com",
    "publisher5@test.com",
    "publisher6@test.com",
    "publisher7@test.com",
    "publisher8@test.com",
    "publisher9@test.com",
    "publisher10@test.com",
    user.email
  ]));

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleToggleConsumer = (email: string) => {
    if (selectedConsumers.includes(email)) {
      setSelectedConsumers(selectedConsumers.filter(e => e !== email));
    } else {
      setSelectedConsumers([...selectedConsumers, email]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStats(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const extractedEmails: string[] = [];

      // Flatten array and look for email-like strings
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      jsonData.forEach((row: any) => {
        if (Array.isArray(row)) {
          row.forEach((cell: any) => {
            if (typeof cell === 'string' && emailRegex.test(cell.trim())) {
              extractedEmails.push(cell.trim());
            }
          });
        }
      });

      const uniqueEmails = [...new Set(extractedEmails)];
      const newEmails = uniqueEmails.filter(email => !selectedConsumers.includes(email));

      if (newEmails.length > 0) {
        setSelectedConsumers(prev => [...prev, ...newEmails]);
        setUploadStats({
          total: uniqueEmails.length,
          new: newEmails.length
        });
      } else {
        alert('No new valid emails found in the file.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Check for duplicate options (case-insensitive)
  const hasDuplicateOptions = () => {
    const validOptions = options.filter(o => o.trim()).map(o => o.trim().toLowerCase());
    const uniqueOptions = new Set(validOptions);
    return uniqueOptions.size !== validOptions.length;
  };

  const handlePublish = async () => {
    setShowErrors(true); // Always show errors when clicking publish
    if (!isValid) {
      // Small delay to allow showErrors to trigger re-render and display error messages
      setTimeout(() => {
        const firstError = document.querySelector('.text-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setIsPublishing(true);
    console.log(`[CreatePoll] [${new Date().toLocaleTimeString()}] 📝 Starting poll creation process...`);

    try {
      const validOptions = options.filter(o => o.trim());
      const finalDefaultResponse = useCustomDefault ? customDefault : defaultResponse;

      const tLabels = parseLabelsFromText(question);
      options.forEach(o => tLabels.push(...parseLabelsFromText(o)));
      const derived = new Set(tLabels);
      const combinedLabels = Array.from(new Set([...Array.from(derived), ...explicitLabels.map(stripLabelMarkers)]));

      const poll: Poll = {
        id: `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        publisherEmail: user.email,
        publisherName: user.name,
        question,
        options: validOptions.map((text, index) => ({
          id: `opt-${index}`,
          text: text.trim()
        })),
        defaultResponse: finalDefaultResponse,
        showDefaultToConsumers,
        anonymityMode,
        deadline: new Date(deadline).toISOString(),
        isPersistentFinalAlert,
        consumers: selectedConsumers,
        publishedAt: new Date().toISOString(),
        status: isScheduled ? 'scheduled' : 'active',
        isPersistentAlert: false,
        alertBeforeMinutes: 15,
        scheduledFor: isScheduled ? new Date(scheduleTime).toISOString() : undefined,
        labels: combinedLabels.map(formatLabelName)
      };

      console.log(`[CreatePoll] [${new Date().toLocaleTimeString()}] 📋 Poll data prepared:`, {
        id: poll.id,
        question: poll.question,
        optionsCount: poll.options.length,
        consumersCount: poll.consumers.length,
        deadline: poll.deadline,
        isPersistentFinalAlert: poll.isPersistentFinalAlert,
        anonymityMode: poll.anonymityMode
      });

      console.log(`[CreatePoll] [${new Date().toLocaleTimeString()}] 🚀 Calling onCreatePoll...`);
      await onCreatePoll(poll);
      console.log(`[CreatePoll] [${new Date().toLocaleTimeString()}] ✅ Poll creation completed successfully`);

      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setDefaultResponse('');
      setCustomDefault('');
      setUseCustomDefault(false);
      setShowDefaultToConsumers(false);
      setAnonymityMode('record');
      setDeadline('');
      setIsScheduled(false);
      setScheduleTime('');
      setIsPersistentFinalAlert(false);
      setSelectedConsumers([]);
      setExplicitLabels([]);
      setShowPreview(false);
      setUploadStats(null);
      setShowErrors(false);
    } catch (error) {
      console.error(`[CreatePoll] [${new Date().toLocaleTimeString()}] ❌ Error publishing poll:`, error);
    } finally {
      setIsPublishing(false);
    }
  };

  const isDateValid = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date > new Date();
  };

  const isScheduleTimeValid = (scheduleStr: string, deadlineStr: string) => {
    if (!scheduleStr) return false;
    const scheduleDate = new Date(scheduleStr);
    const now = new Date();

    // Must be in the future
    if (scheduleDate <= now) return false;

    // Must be before deadline if deadline is set
    if (deadlineStr) {
      const deadlineDate = new Date(deadlineStr);
      if (scheduleDate >= deadlineDate) return false;
    }

    return true;
  };

  const handleLabelClick = (labelName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    let targetId: string | null = null;

    // Check Question
    if (parseLabelsFromText(question).includes(labelName)) {
      targetId = 'poll-question';
    } else {
      // Check Options
      for (let i = 0; i < options.length; i++) {
        if (parseLabelsFromText(options[i]).includes(labelName)) {
          targetId = `poll-option-${i}`;
          break;
        }
      }
    }

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        // Custom smooth scroll implementation for "slower/better" feel
        const scrollContainer = el.closest('.overflow-y-auto') || document.scrollingElement || document.documentElement;
        const start = (scrollContainer as HTMLElement).scrollTop || window.pageYOffset;

        // Target position: center-aligned in viewport/container
        const rect = el.getBoundingClientRect();
        const containerRect = scrollContainer instanceof HTMLElement ? scrollContainer.getBoundingClientRect() : { top: 0, height: window.innerHeight };
        const targetPos = start + rect.top - containerRect.top - (containerRect.height / 2) + (rect.height / 2);

        const distance = targetPos - start;
        const duration = 1000; // 1 second for a nice slow feel
        let startTime: number | null = null;

        const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const animation = (currentTime: number) => {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          const easeProgress = easeInOutCubic(progress);

          if (scrollContainer === document.documentElement || scrollContainer === document.scrollingElement) {
            window.scrollTo(0, start + distance * easeProgress);
          } else {
            (scrollContainer as HTMLElement).scrollTop = start + distance * easeProgress;
          }

          if (progress < 1) {
            requestAnimationFrame(animation);
          } else {
            el.focus();
            // Visual feedback: Flash a blue highlight
            el.style.transition = 'all 0.5s ease-in-out';
            el.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
            el.style.borderColor = '#3b82f6';

            setTimeout(() => {
              el.style.boxShadow = '';
              el.style.borderColor = '';
            }, 1500);
          }
        };

        requestAnimationFrame(animation);
      }
    }
  };

  const isValid =
    question.trim() &&
    options.filter(o => o.trim()).length >= 2 &&
    !hasDuplicateOptions() &&
    (useCustomDefault ? customDefault.trim() : defaultResponse) &&
    isDateValid(deadline) &&
    (!isScheduled || (scheduleTime && isScheduleTimeValid(scheduleTime, deadline))) &&
    selectedConsumers.length > 0;

  const canPreview =
    question.trim() &&
    options.filter(o => o.trim()).length >= 2 &&
    (useCustomDefault ? customDefault.trim() : defaultResponse) &&
    deadline &&
    (!isScheduled || scheduleTime);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-slate-900 mb-6">Create New Poll</h2>

        <div className="space-y-6">


          {/* Schedule Toggle Section */}
          {/* Schedule Toggle Section */}
          <div
            onClick={() => setIsScheduled(!isScheduled)}
            className={cn(
              "bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group",
              isScheduled
                ? "border-blue-100 shadow-[0_8px_30px_rgb(37,99,235,0.08)] bg-blue-50/10"
                : "border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            )}
          >
            <div className="p-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                    isScheduled ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                  )}>
                    <CalendarClock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Schedule for Later</h3>
                    <p className="text-sm text-slate-500 font-medium">Automatically publish at a future date and time</p>
                  </div>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsScheduled(!isScheduled);
                  }}
                  className="flex items-center"
                >
                  <div className={cn(
                    "relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out shadow-inner border",
                    isScheduled
                      ? "bg-blue-600 border-blue-500"
                      : "bg-slate-200 border-slate-300"
                  )}>
                    <div
                      className="absolute top-1/2 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-300 ease-in-out"
                      style={{
                        left: '4px',
                        transform: isScheduled ? 'translate(20px, -50%)' : 'translate(0, -50%)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {isScheduled && (
                <div
                  className="mt-6 pt-6 border-t border-blue-100/50 animate-in fade-in slide-in-from-top-4 duration-500 ease-out"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid sm:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2.5">
                      <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                        Select Start Time
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <input
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-4 transition-all duration-200 shadow-sm",
                            showErrors && (!scheduleTime || !isScheduleTimeValid(scheduleTime, deadline))
                              ? "border-red-200 ring-red-500/10 focus:ring-red-500/20"
                              : "border-slate-200 focus:border-blue-500/50 ring-blue-500/10 focus:ring-blue-500/20"
                          )}
                          min={new Date().toISOString().slice(0, 16)}
                          max={deadline ? new Date(deadline).toISOString().slice(0, 16) : undefined}
                        />
                      </div>
                      {showErrors && !scheduleTime && (
                        <p className="text-red-500 text-xs mt-1">Schedule time is required</p>
                      )}
                      {showErrors && scheduleTime && !isScheduleTimeValid(scheduleTime, deadline) && (
                        <p className="text-red-500 text-xs mt-1">
                          {new Date(scheduleTime) <= new Date()
                            ? "Schedule time must be in the future"
                            : "Schedule time must be before the deadline"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-slate-700 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <LabelInput
              id="poll-question"
              value={question}
              onChange={setQuestion}
              labels={labels}
              placeholder="e.g., Are you on leave tomorrow? (Type # to add labels)"
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${showErrors && !question.trim()
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:ring-blue-500'
                }`}
            />
            {showErrors && !question.trim() && (
              <p className="text-red-500 text-xs mt-1">Question is required</p>
            )}
          </div>

          {/* Options */}
          <div>
            <label className="block text-slate-700 mb-2">
              Options <span className="text-red-500">*</span>
              <span className="text-sm text-slate-500 ml-2">(minimum 2 required)</span>
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <LabelInput
                    id={`poll-option-${index}`}
                    value={option}
                    onChange={(value) => handleOptionChange(index, value)}
                    labels={labels}
                    placeholder={`Option ${index + 1} (Type # to add labels)`}
                    containerClassName="flex-1"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${showErrors && !option.trim()
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-blue-500'
                      }`}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {showErrors && options.filter(o => o.trim()).length < 2 && (
                <p className="text-red-500 text-xs mt-1">At least 2 options are required</p>
              )}
              {showErrors && hasDuplicateOptions() && (
                <p className="text-red-500 text-xs mt-1">Duplicate options are not allowed</p>
              )}
              <button
                onClick={handleAddOption}
                disabled={options.length >= 10}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Option {options.length >= 10 && <span className="text-xs text-slate-500">(Limit reached)</span>}
              </button>
            </div>
          </div>

          {/* Default Response */}
          <div>
            <label className="block text-slate-700 mb-2">
              Default Response <span className="text-red-500">*</span>
              <span className="text-sm text-slate-500 ml-2">
                (applied if consumer doesn't submit)
              </span>
            </label>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="useCustomDefault"
                  checked={useCustomDefault}
                  onChange={(e) => setUseCustomDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="useCustomDefault" className="text-sm text-slate-700">
                  Use custom default response
                </label>
              </div>

              {useCustomDefault ? (
                <LabelInput
                  value={customDefault}
                  onChange={setCustomDefault}
                  labels={labels}
                  placeholder="e.g., I don't know, N/A, They are on leave tomorrow (Type # for labels)"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${showErrors && !customDefault.trim()
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-blue-500'
                    }`}
                />
              ) : (
                <Select
                  value={defaultResponse}
                  onValueChange={setDefaultResponse}
                >
                  <SelectTrigger className={cn(
                    "w-full h-auto min-h-[42px] px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all bg-white",
                    showErrors && !defaultResponse
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  )}>
                    <SelectValue placeholder="Select from options" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-white opacity-100 shadow-lg border border-slate-200"
                    position="popper"
                    sideOffset={4}
                    style={{ width: 'var(--radix-select-trigger-width)' }}
                  >
                    {options.filter(o => o.trim()).map((option, index) => (
                      <SelectItem
                        key={index}
                        value={option}
                        className="py-3 px-4 whitespace-normal break-words cursor-pointer hover:bg-slate-50 focus:bg-slate-100 data-[state=checked]:bg-slate-100"
                        hideIndicator
                      >
                        <LabelText text={option} labels={labels} className="inline-block w-full" />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {showErrors && !(useCustomDefault ? customDefault.trim() : defaultResponse) && (
                <p className="text-red-500 text-xs mt-1">Default response is required</p>
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="showDefault"
                checked={showDefaultToConsumers}
                onChange={(e) => setShowDefaultToConsumers(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="showDefault" className="text-slate-700">
                Show default response to consumers
                <p className="text-sm text-slate-500 mt-1">
                  Consumers will see what response will be recorded if they don't submit
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="persistent"
                checked={isPersistentFinalAlert}
                onChange={(e) => setIsPersistentFinalAlert(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="persistent" className="text-slate-700">
                Make final alert (1 min) persistent
                <p className="text-sm text-slate-500 mt-1">
                  The 1-minute warning will require action before it can be dismissed
                </p>
              </label>
            </div>
          </div>

          {/* Poll Labels */}
          <div>
            <label className="block text-slate-700 mb-2">
              Poll Labels
              <span className="text-sm text-slate-500 ml-2">
                (Tags from text are auto-selected)
              </span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full justify-between flex items-center px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="flex flex-wrap gap-2 items-center py-1">
                    {(() => {
                      const tLabels = parseLabelsFromText(question);
                      options.forEach(o => tLabels.push(...parseLabelsFromText(o)));
                      const derived = new Set(tLabels);
                      const combined = Array.from(new Set([...Array.from(derived), ...explicitLabels]));

                      if (combined.length === 0) return <span className="text-slate-500">Select Labels...</span>;

                      return combined.map(name => {
                        const labelObj = labels.find(l => stripLabelMarkers(l.name) === name);
                        const color = labelObj?.color || '#3b82f6';
                        const count = tLabels.filter(l => l === name).length;
                        const isDerived = derived.has(name);
                        const isExplicit = explicitLabels.includes(name);

                        return (
                          <span
                            key={name}
                            onClick={(e) => count > 0 && handleLabelClick(name, e)}
                            className={cn(
                              "relative inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border shadow-sm transition-opacity",
                              count > 0 ? "cursor-pointer hover:opacity-80" : "cursor-default"
                            )}
                            style={{
                              backgroundColor: `${color}20`,
                              borderColor: `${color}50`,
                              color: color
                            }}
                          >
                            {parseLabelName(name)}
                            {isDerived ? (
                              <span
                                className="absolute -top-1 -right-1 translate-x-[30%] -translate-y-[30%] flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white shadow-sm ring-1 ring-white"
                                style={{ backgroundColor: color }}
                              >
                                {count}
                              </span>
                            ) : isExplicit ? (
                              <span
                                className="absolute -top-1 -right-1 translate-x-[30%] -translate-y-[30%] flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-white cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExplicitLabels(prev => prev.filter(l => l !== name));
                                }}
                              >
                                <X className="w-2.5 h-2.5" />
                              </span>
                            ) : null}
                          </span>
                        );
                      });
                    })()}
                  </div>
                  <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="bg-white border border-slate-200 shadow-xl p-0"
                align="start"
                style={{ width: 'var(--radix-popover-trigger-width)' }}
              >
                <div className="p-3 max-h-60 overflow-y-auto flex flex-wrap gap-2">
                  {(() => {
                    const tLabels = parseLabelsFromText(question);
                    options.forEach(o => tLabels.push(...parseLabelsFromText(o)));
                    const derived = new Set(tLabels);
                    const combined = new Set([...Array.from(derived), ...explicitLabels.map(stripLabelMarkers)]);
                    const availableLabels = labels.filter(l => !combined.has(stripLabelMarkers(l.name)));

                    if (availableLabels.length === 0) {
                      return <p className="text-sm text-center text-slate-500 py-4 w-full">All available labels are in use.</p>;
                    }

                    return (
                      <TooltipProvider key="label-tooltips">
                        {availableLabels.map(label => (
                          <Tooltip key={label.id} delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                                style={{
                                  backgroundColor: `${label.color}15`,
                                  borderColor: `${label.color}40`,
                                  color: label.color
                                }}
                                onClick={() => setExplicitLabels(prev => [...prev, stripLabelMarkers(label.name)])}
                              >
                                {parseLabelName(label.name)}
                              </div>
                            </TooltipTrigger>
                            {label.description && (
                              <TooltipContent
                                side="top"
                                className="bg-white border border-slate-200 shadow-xl text-slate-700 px-3 py-2 rounded-lg max-w-[200px]"
                                sideOffset={8}
                              >
                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider opacity-70">Description</p>
                                  <p className="text-xs leading-relaxed">{label.description}</p>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    );
                  })()}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Anonymity Mode */}
          <div>
            <label className="block text-slate-700 mb-3">
              Response Tracking <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="anonymity"
                  checked={anonymityMode === 'record'}
                  onChange={() => setAnonymityMode('record')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="text-slate-900">Record Responses</p>
                  <p className="text-sm text-slate-500">
                    You will see individual consumer emails and their responses
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="anonymity"
                  checked={anonymityMode === 'anonymous'}
                  onChange={() => setAnonymityMode('anonymous')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="text-slate-900">Anonymous</p>
                  <p className="text-sm text-slate-500">
                    Responses will be anonymous - you won't see who responded
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-slate-700 mb-2">
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${showErrors && !isDateValid(deadline)
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-300 focus:ring-blue-500'
                }`}
              min={getMinDateTime()}
            />
            {showErrors && !isDateValid(deadline) && (
              <p className="text-red-500 text-xs mt-1">Deadline must be in future date and time</p>
            )}
            <p className="text-sm text-slate-500 mt-2">
              Notifications will be sent at 60, 30, 15, and 1 minute before this deadline
            </p>
          </div>

          {/* Consumer Selection */}
          <div>
            <label className="block text-slate-700 mb-3">
              Select Consumers <span className="text-red-500">*</span>
              <span className="text-sm text-slate-500 ml-2">
                ({selectedConsumers.length} selected)
              </span>
            </label>

            <div className="mb-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Import from Excel/CSV</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {isUploading && <span className="text-sm text-slate-500">Processing...</span>}
                {uploadStats && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Added {uploadStats.new} new emails
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-1">
                Supports .xlsx, .xls, .csv. Will extract any valid emails found.
              </p>
            </div>

            <div className="border border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {/* Show uploaded consumers first */}
              {selectedConsumers
                .filter(email => !availableConsumers.includes(email))
                .map(email => (
                  <label
                    key={email}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors bg-blue-50/50"
                  >
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => handleToggleConsumer(email)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{email}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Imported
                    </span>
                  </label>
                ))}

              {availableConsumers.map(email => (
                <label
                  key={email}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedConsumers.includes(email)}
                    onChange={() => handleToggleConsumer(email)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">{email}</span>
                  {email === user.email && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                </label>
              ))}
            </div>
            {showErrors && selectedConsumers.length === 0 && (
              <p className="text-red-500 text-xs mt-1">At least one consumer must be selected</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!canPreview}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md min-w-[140px] justify-center"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isScheduled ? 'Schedule Poll' : 'Publish Poll'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {showPreview && (
        <PollPreview
          poll={{
            id: 'preview',
            publisherEmail: user.email,
            publisherName: user.name,
            question,
            options: options.filter(o => o.trim()).map((text, index) => ({
              id: `opt-${index}`,
              text
            })),
            defaultResponse: useCustomDefault ? customDefault : defaultResponse,
            showDefaultToConsumers,
            anonymityMode,
            deadline,
            isPersistentFinalAlert,
            consumers: selectedConsumers,
            publishedAt: new Date().toISOString(),
            status: 'active',
            isPersistentAlert: false,
            alertBeforeMinutes: 15,
            labels: Array.from(new Set([...parseLabelsFromText(question), ...options.flatMap(o => parseLabelsFromText(o)), ...explicitLabels]))
          }}
          onClose={() => setShowPreview(false)}
        />
      )
      }
    </div >
  );
}