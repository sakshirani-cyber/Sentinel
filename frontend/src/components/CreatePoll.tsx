import { useState /*, useEffect */ } from 'react';
import { User, Poll } from '../App';
import { Plus, X, Eye, Check, Upload, Loader2 /*, CalendarClock */ } from 'lucide-react';
import * as XLSX from 'xlsx';
import PollPreview from './PollPreview';
import { cn } from './ui/utils';
/*
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
*/
import {
  Select,
  SelectContent,
  // SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/*
interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}
*/

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
  // const [isScheduled, setIsScheduled] = useState(false);
  // const [scheduleTime, setScheduleTime] = useState('');
  const [isPersistentFinalAlert, setIsPersistentFinalAlert] = useState(false);
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; new: number } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // const [labels, setLabels] = useState<Label[]>([]);
  // const [explicitLabels, setExplicitLabels] = useState<string[]>([]);

  // Fetch labels on mount
  /*
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
  */

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

  const isDateValid = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date > new Date();
  };

  /*
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
  */

  const isValid =
    question.trim() &&
    options.filter(o => o.trim()).length >= 2 &&
    !hasDuplicateOptions() &&
    (useCustomDefault ? customDefault.trim() : defaultResponse) &&
    isDateValid(deadline) &&
    // (!isScheduled || (scheduleTime && isScheduleTimeValid(scheduleTime, deadline))) &&
    selectedConsumers.length > 0;

  const canPreview =
    question.trim() &&
    options.filter(o => o.trim()).length >= 2 &&
    (useCustomDefault ? customDefault.trim() : defaultResponse) &&
    deadline;
  // (!isScheduled || scheduleTime);

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
        status: /* isScheduled ? 'scheduled' : */ 'active',
        isPersistentAlert: false,
        alertBeforeMinutes: 15,
        // scheduledFor: /* isScheduled ? new Date(scheduleTime).toISOString() : */ undefined,
        // labels: [] // combinedLabels.map(formatLabelName)
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
      // setIsScheduled(false);
      // setScheduleTime('');
      setIsPersistentFinalAlert(false);
      setSelectedConsumers([]);
      // setExplicitLabels([]);
      setShowPreview(false);
      setUploadStats(null);
      setShowErrors(false);
    } catch (error) {
      console.error(`[CreatePoll] [${new Date().toLocaleTimeString()}] ❌ Error publishing poll:`, error);
    } finally {
      setIsPublishing(false);
    }
  };

  /*
  const handleLabelClick = (labelName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Implementation for clicking labels
  };
  */

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-slate-900 mb-6">Create New Poll</h2>

        <div className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-slate-700 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              id="poll-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Are you on leave tomorrow?"
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
                  <input
                    id={`poll-option-${index}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
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
                <input
                  value={customDefault}
                  onChange={(e) => setCustomDefault(e.target.value)}
                  placeholder="e.g., I don't know, N/A"
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
                      <div
                        key={index}
                        className="py-3 px-4 whitespace-normal break-words cursor-pointer hover:bg-slate-50 focus:bg-slate-100 data-[state=checked]:bg-slate-100"
                      >
                        {option}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {showErrors && !(useCustomDefault ? customDefault.trim() : defaultResponse) && (
                <p className="text-red-500 text-xs mt-1">Default response is required</p>
              )}
            </div>
          </div>

          {/* Settings Checkboxes */}
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
                  Publish Poll
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
            // labels: labels
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}