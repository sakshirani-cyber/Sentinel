import { useState, useEffect } from 'react';
import { Poll } from '../types';
import { Plus, X, Check, Upload, AlertCircle, Loader2 } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { parseLabelsFromText, stripLabelMarkers, parseLabelName, formatLabelName } from '../utils/labelUtils';
import LabelInput from './LabelInput';
import LabelText from './LabelText';
import { cn } from './ui/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

interface Label {
    id: string;
    name: string;
    color: string;
    description?: string;
}

interface EditPollModalProps {
    poll: Poll;
    onUpdate: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
    onClose: () => void;
}

export default function EditPollModal({ poll, onUpdate, onClose }: EditPollModalProps) {
    const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const getMinDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().slice(0, 16);
    };

    const isDateValid = (dateStr: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date > new Date();
    };
    const isOptionDefault = poll.options.some(o => o.text === poll.defaultResponse);
    const [customDefault, setCustomDefault] = useState(isOptionDefault ? '' : poll.defaultResponse);
    const [useCustomDefault, setUseCustomDefault] = useState(!isOptionDefault);
    const [question, setQuestion] = useState(poll.question);
    const [options, setOptions] = useState<string[]>(poll.options.map(o => o.text));
    const [defaultResponse, setDefaultResponse] = useState(isOptionDefault ? poll.defaultResponse : '');
    const [showDefaultToConsumers, setShowDefaultToConsumers] = useState(poll.showDefaultToConsumers);
    const [anonymityMode, setAnonymityMode] = useState<'anonymous' | 'record'>(poll.anonymityMode);
    const [deadline, setDeadline] = useState(formatDateForInput(poll.deadline));
    // Scheduled For state - only relevant if poll.status is 'scheduled'
    const [scheduledFor, setScheduledFor] = useState(formatDateForInput(poll.scheduledFor || ''));
    const [isPersistentFinalAlert, setIsPersistentFinalAlert] = useState(poll.isPersistentFinalAlert);
    const [selectedConsumers, setSelectedConsumers] = useState<string[]>(poll.consumers);
    const [republish, setRepublish] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<{ total: number; new: number } | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [explicitLabels, setExplicitLabels] = useState<string[]>((poll.labels || []).map(stripLabelMarkers));

    const [isSaving, setIsSaving] = useState(false);
    const [labels, setLabels] = useState<Label[]>([]);

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

    const availableConsumers = Array.from(new Set([
        ...poll.consumers,
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
        "publisher10@test.com"
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
            setSelectedConsumers(prev => prev.filter(e => e !== email));
        } else {
            setSelectedConsumers(prev => [...prev, email]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStats(null);

        try {
            const data = await file.arrayBuffer();
            const XLSX = await import('xlsx');
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

    const handleLabelClick = (labelName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!explicitLabels.includes(labelName)) {
            setExplicitLabels(prev => [...prev, labelName]);
        }
    };

    // Check for duplicate options (case-insensitive)
    const hasDuplicateOptions = () => {
        const validOptions = options.filter(o => o.trim()).map(o => o.trim().toLowerCase());
        const uniqueOptions = new Set(validOptions);
        return uniqueOptions.size !== validOptions.length;
    };

    const handleSave = async () => {
        setShowErrors(true);
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

        setIsSaving(true);
        try {
            const validOptions = options.filter(o => o.trim());
            const finalDefaultResponse = useCustomDefault ? customDefault : defaultResponse;

            const updates: Partial<Poll> = {
                question,
                options: validOptions.map((text, index) => ({
                    id: `opt-${index}`,
                    text
                })),
                defaultResponse: finalDefaultResponse,
                showDefaultToConsumers,
                anonymityMode,
                deadline: new Date(deadline).toISOString(),
                isPersistentFinalAlert,
                consumers: selectedConsumers,
                labels: Array.from(new Set([
                    ...parseLabelsFromText(question),
                    ...options.flatMap(o => parseLabelsFromText(o)),
                    ...explicitLabels.map(stripLabelMarkers)
                ])).map(formatLabelName),
                isEdited: true
            };

            // Include scheduledFor only if it's a scheduled poll
            if (poll.status === 'scheduled' && scheduledFor) {
                updates.scheduledFor = new Date(scheduledFor).toISOString();
            }

            console.log('[EditPollModal] Saving updates:', { updates, republish });
            // Republish flag is passed from state. Validation ensures it's correct.
            await onUpdate(poll.id, updates, republish);
            onClose();
        } catch (error) {
            console.error('Error saving poll:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const currentDefaultResponse = useCustomDefault ? customDefault : defaultResponse;

    // Check if scheduledTime is valid (must be future, must be before deadline)
    const isScheduledTimeValid = () => {
        if (poll.status !== 'scheduled') return true;
        if (!scheduledFor) return false;

        const schedTime = new Date(scheduledFor);
        const deadlineTime = new Date(deadline);
        const now = new Date();

        return schedTime > now && schedTime < deadlineTime;
    };

    const hasChanges =
        question !== poll.question ||
        JSON.stringify(options) !== JSON.stringify(poll.options.map(o => o.text)) ||
        currentDefaultResponse !== poll.defaultResponse ||
        showDefaultToConsumers !== poll.showDefaultToConsumers ||
        anonymityMode !== poll.anonymityMode ||
        deadline !== formatDateForInput(poll.deadline) ||
        (poll.status === 'scheduled' && scheduledFor !== formatDateForInput(poll.scheduledFor || '')) ||
        isPersistentFinalAlert !== poll.isPersistentFinalAlert ||
        JSON.stringify([...selectedConsumers].sort()) !== JSON.stringify([...poll.consumers].sort());


    const isAnonymityChanged = anonymityMode !== poll.anonymityMode;
    const isRepublishMissing = isAnonymityChanged && !republish;

    // Check for 15-min buffer requirement when enabling persistent alert
    const isPersistentAlertEnabled = !poll.isPersistentFinalAlert && isPersistentFinalAlert;
    const getMinutesUntilDeadline = () => {
        if (!deadline) return 0;
        const now = new Date();
        const d = new Date(deadline);
        return (d.getTime() - now.getTime()) / 60000;
    };
    const isBufferInsufficient = isPersistentAlertEnabled && getMinutesUntilDeadline() < 15;

    const isValid =
        question.trim() &&
        options.filter(o => o.trim()).length >= 2 &&
        !hasDuplicateOptions() &&
        currentDefaultResponse &&
        isDateValid(deadline) &&
        isScheduledTimeValid() &&
        selectedConsumers.length > 0 &&
        selectedConsumers.length > 0 &&
        !isRepublishMissing &&
        !isBufferInsufficient &&
        hasChanges;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex-shrink-0 bg-muted border-b border-border p-6 flex items-center justify-between">
                    <h2 className="text-xl font-medium text-foreground">Edit Poll</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-foreground/60 hover:text-foreground hover:bg-primary/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Question */}
                    <div>
                        <label className="block text-foreground mb-2 font-medium">
                            Question <span className="text-red-500">*</span>
                        </label>
                        <LabelInput
                            value={question}
                            onChange={setQuestion}
                            labels={labels}
                            placeholder="Type # to add labels"
                            className={`w-full px-4 py-3 rounded-xl border bg-card focus:outline-none transition-all ${showErrors && !question.trim()
                                ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                                }`}
                        />
                        {showErrors && !question.trim() && (
                            <p className="text-red-500 text-xs mt-1">Question is required</p>
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-foreground mb-2 font-medium">
                            Options <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <LabelInput
                                        value={option}
                                        onChange={(value) => handleOptionChange(index, value)}
                                        labels={labels}
                                        placeholder={`Option ${index + 1} (Type # to add labels)`}
                                        containerClassName="flex-1 min-w-0"
                                        className={`w-full px-4 py-2 rounded-xl border bg-card focus:outline-none transition-all ${showErrors && !option.trim()
                                            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                            : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                                            }`}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            onClick={() => handleRemoveOption(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                                className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-muted rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Add Option {options.length >= 10 && <span className="text-xs text-foreground/60">(Limit reached)</span>}
                            </button>
                        </div>
                    </div>

                    {/* Default Response */}
                    <div>
                        <label className="block text-foreground mb-2 font-medium">
                            Default Response <span className="text-red-500">*</span>
                        </label>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="useCustomDefault"
                                    checked={useCustomDefault}
                                    onChange={(e) => setUseCustomDefault(e.target.checked)}
                                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                />
                                <label htmlFor="useCustomDefault" className="text-sm text-foreground cursor-pointer">
                                    Use custom default response
                                </label>
                            </div>

                            {useCustomDefault ? (
                                <LabelInput
                                    value={customDefault || ''}
                                    onChange={setCustomDefault}
                                    labels={labels}
                                    placeholder="e.g., I don't know, N/A (Type # to add labels)"
                                    className={`w-full px-4 py-2 rounded-xl border bg-card focus:outline-none transition-all ${showErrors && !(customDefault || '').trim()
                                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                        : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                                        }`}
                                />
                            ) : (
                                <Select
                                    value={defaultResponse}
                                    onValueChange={setDefaultResponse}
                                >
                                    <SelectTrigger className={cn(
                                        "w-full h-auto min-h-[42px] px-4 py-2 rounded-xl border bg-card focus:outline-none transition-all",
                                        showErrors && !defaultResponse
                                            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                            : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
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
                            {showErrors && !currentDefaultResponse && (
                                <p className="text-red-500 text-xs mt-1">Default response is required</p>
                            )}
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 border border-border rounded-xl bg-muted">
                                <input
                                    type="checkbox"
                                    id="showDefault"
                                    checked={showDefaultToConsumers}
                                    onChange={(e) => setShowDefaultToConsumers(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                />
                                <label htmlFor="showDefault" className="text-foreground text-sm">
                                    <span className="font-medium">Show default to consumers</span>
                                    <p className="text-foreground/60 mt-0.5">
                                        Consumers will see what response will be recorded if they don't submit
                                    </p>
                                </label>
                            </div>

                            <div className="flex items-start gap-3 p-4 border border-border rounded-xl bg-muted">
                                <input
                                    type="checkbox"
                                    id="persistent"
                                    checked={isPersistentFinalAlert}
                                    onChange={(e) => setIsPersistentFinalAlert(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                />
                                <label htmlFor="persistent" className="text-foreground text-sm">
                                    <span className="font-medium">Make final alert (1 min) persistent</span>
                                    <p className="text-foreground/60 mt-0.5">
                                        The 15-minute warning will require action before it can be dismissed
                                    </p>
                                    {showErrors && isBufferInsufficient && (
                                        <p className="text-red-500 text-xs mt-2 font-medium flex items-start gap-2 bg-red-50 p-2 rounded border border-red-100">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                Enabling persistent alerts requires at least 15 minutes notice.
                                                Please extend the deadline.
                                            </span>
                                        </p>
                                    )}
                                </label>
                            </div>

                            <div className="flex items-start gap-3 p-4 border border-border rounded-xl bg-muted">
                                <input
                                    type="checkbox"
                                    id="republish"
                                    checked={republish}
                                    onChange={(e) => setRepublish(e.target.checked)}
                                    className={`mt-1 w-4 h-4 text-primary rounded border-border focus:ring-primary ${showErrors && isRepublishMissing ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                                />
                                <label htmlFor="republish" className="text-foreground text-sm">
                                    <span className="font-medium">Republish Poll</span>
                                    <p className="text-foreground/60 mt-0.5">
                                        If enabled, <strong>all existing responses will be deleted</strong> and consumers must submit again.
                                    </p>
                                    {showErrors && isRepublishMissing && (
                                        <p className="text-red-500 text-xs mt-2 font-medium flex items-start gap-2 bg-red-50 p-2 rounded border border-red-100">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span>Required when changing response tracking mode</span>
                                        </p>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {poll.status === 'scheduled' && (
                                <div>
                                    <label className="block text-foreground mb-2 font-medium">Scheduled Publication Time <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                        className={`w-full px-4 py-2 rounded-xl border bg-card focus:outline-none focus:ring-1 transition-all ${(showErrors || hasChanges) && !isScheduledTimeValid()
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                            : 'border-border focus:border-primary focus:ring-primary'
                                            }`}
                                        min={getMinDateTime()}
                                    />
                                    {showErrors && !isScheduledTimeValid() && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {!scheduledFor
                                                ? 'Publication time is required'
                                                : new Date(scheduledFor) >= new Date(deadline)
                                                    ? 'Publication time must be before deadline'
                                                    : 'Please select a valid future date'}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-foreground mb-2 font-medium">Deadline <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-xl border bg-card focus:outline-none focus:ring-1 transition-all ${(showErrors || hasChanges) && !isDateValid(deadline)
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-border focus:border-primary focus:ring-primary'
                                        }`}
                                    min={getMinDateTime()}
                                />
                                {showErrors && !isDateValid(deadline) && (
                                    <p className="text-red-500 text-xs mt-1">Please select a valid future date</p>
                                )}
                                <p className="text-sm text-foreground/60 mt-2">
                                    Notifications will be sent at 60, 30, 15, and 1 minute before deadline
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Poll Labels */}
                    <div className="pt-2">
                        <label className="block text-foreground mb-2 font-medium">
                            Poll Labels
                            <span className="text-sm text-foreground/60 ml-2">
                                (Tags from text are auto-selected)
                            </span>
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="w-full justify-between flex items-center px-4 py-2 rounded-xl border border-border hover:bg-muted transition-all text-left bg-card"
                                >
                                    <div className="flex flex-wrap gap-2 items-center py-1">
                                        {(() => {
                                            const tLabels = parseLabelsFromText(question);
                                            options.forEach(o => tLabels.push(...parseLabelsFromText(o)));
                                            const derived = new Set(tLabels);
                                            const combined = Array.from(new Set([...Array.from(derived), ...explicitLabels]));

                                            if (combined.length === 0) return <span className="text-foreground/50">Select Labels...</span>;

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
                        <label className="block text-foreground mb-3 font-medium">
                            Response Tracking <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors bg-muted">
                                <input
                                    type="radio"
                                    name="anonymity"
                                    checked={anonymityMode === 'record'}
                                    onChange={() => setAnonymityMode('record')}
                                    className="w-4 h-4 text-primary"
                                />
                                <div>
                                    <p className="text-foreground font-medium">Record Responses</p>
                                    <p className="text-sm text-foreground/60">
                                        You will see individual consumer emails and their responses
                                    </p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors bg-muted">
                                <input
                                    type="radio"
                                    name="anonymity"
                                    checked={anonymityMode === 'anonymous'}
                                    onChange={() => setAnonymityMode('anonymous')}
                                    className="w-4 h-4 text-primary"
                                />
                                <div>
                                    <p className="text-foreground font-medium">Anonymous</p>
                                    <p className="text-sm text-foreground/60">
                                        Responses will be anonymous - you won't see who responded
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Consumers */}
                    <div>
                        <label className="block text-foreground mb-3 font-medium">
                            Consumers <span className="text-red-500">*</span>
                            <span className="text-sm text-foreground/60 ml-2">
                                ({selectedConsumers.length} selected)
                            </span>
                        </label>

                        <div className="mb-3">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors shadow-sm">
                                    <Upload className="w-4 h-4 text-foreground/60" />
                                    <span className="text-sm text-foreground">Import from Excel/CSV</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                </label>
                                {isUploading && <span className="text-sm text-foreground/60">Processing...</span>}
                                {uploadStats && (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Added {uploadStats.new} new emails
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-foreground/60 mt-1 ml-1">
                                Supports .xlsx, .xls, .csv. Will extract any valid emails found.
                            </p>
                        </div>

                        <div className="border border-border rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 bg-card">
                            {/* Show uploaded consumers first */}
                            {selectedConsumers
                                .filter(email => !availableConsumers.includes(email))
                                .map(email => (
                                    <label
                                        key={email}
                                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors bg-blue-50/50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => handleToggleConsumer(email)}
                                            className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                        />
                                        <span className="text-foreground">{email}</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                            Imported
                                        </span>
                                    </label>
                                ))}

                            {availableConsumers.map(email => (
                                <label
                                    key={email}
                                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedConsumers.includes(email)}
                                        onChange={() => handleToggleConsumer(email)}
                                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                    />
                                    <span className="text-foreground">{email}</span>
                                </label>
                            ))}
                        </div>
                        {showErrors && selectedConsumers.length === 0 && (
                            <p className="text-red-500 text-xs mt-1">At least one consumer must be selected</p>
                        )}
                    </div>

                    {/* Validation Messages */}
                    <div className="space-y-2">
                        {!isValid && !hasChanges && (
                            <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-xl">
                                <AlertCircle className="w-5 h-5 text-foreground/60 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground/70">
                                    Make changes to enable saving
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-border p-6 bg-card flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-primary/10 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium min-w-[140px] justify-center glow-on-hover"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
