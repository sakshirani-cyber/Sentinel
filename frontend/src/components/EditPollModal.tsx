import { useState } from 'react';
import { Poll } from '../App';
import { Plus, X, Check, Upload, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

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
        now.setMinutes(now.getMinutes() + 1);
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
    const [isPersistentFinalAlert, setIsPersistentFinalAlert] = useState(poll.isPersistentFinalAlert);
    const [selectedConsumers, setSelectedConsumers] = useState<string[]>(poll.consumers);
    const [republish, setRepublish] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<{ total: number; new: number } | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
                isEdited: true
            };

            console.log('[EditPollModal] Saving updates:', { updates, republish });
            await onUpdate(poll.id, updates, republish);
            onClose();
        } catch (error) {
            console.error('Error saving poll:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const currentDefaultResponse = useCustomDefault ? customDefault : defaultResponse;

    const hasChanges =
        question !== poll.question ||
        JSON.stringify(options) !== JSON.stringify(poll.options.map(o => o.text)) ||
        currentDefaultResponse !== poll.defaultResponse ||
        showDefaultToConsumers !== poll.showDefaultToConsumers ||
        anonymityMode !== poll.anonymityMode ||
        deadline !== formatDateForInput(poll.deadline) ||
        isPersistentFinalAlert !== poll.isPersistentFinalAlert ||
        JSON.stringify([...selectedConsumers].sort()) !== JSON.stringify([...poll.consumers].sort());

    const isValid =
        question.trim() &&
        options.filter(o => o.trim()).length >= 2 &&
        !hasDuplicateOptions() &&
        currentDefaultResponse &&
        isDateValid(deadline) &&
        selectedConsumers.length > 0 &&
        hasChanges;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-mono-bg rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-mono-primary/10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex-shrink-0 bg-mono-primary/5 border-b border-mono-primary/10 p-6 flex items-center justify-between">
                    <h2 className="text-xl font-medium text-mono-text">Edit Poll</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Question */}
                    <div>
                        <label className="block text-mono-text mb-2 font-medium">
                            Question <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border bg-mono-bg focus:outline-none transition-all ${showErrors && !question.trim()
                                ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                : 'border-mono-primary/20 focus:border-mono-primary focus:ring-1 focus:ring-mono-primary'
                                }`}
                        />
                        {showErrors && !question.trim() && (
                            <p className="text-red-500 text-xs mt-1">Question is required</p>
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-mono-text mb-2 font-medium">
                            Options <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className={`flex-1 px-4 py-2 rounded-xl border bg-mono-bg focus:outline-none transition-all ${showErrors && !option.trim()
                                            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                            : 'border-mono-primary/20 focus:border-mono-primary focus:ring-1 focus:ring-mono-primary'
                                            }`}
                                        placeholder={`Option ${index + 1}`}
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
                                className="flex items-center gap-2 px-4 py-2 text-mono-primary hover:bg-mono-primary/5 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Add Option {options.length >= 10 && <span className="text-xs text-mono-text/60">(Limit reached)</span>}
                            </button>
                        </div>
                    </div>

                    {/* Default Response */}
                    <div>
                        <label className="block text-mono-text mb-2 font-medium">
                            Default Response <span className="text-red-500">*</span>
                        </label>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="useCustomDefault"
                                    checked={useCustomDefault}
                                    onChange={(e) => setUseCustomDefault(e.target.checked)}
                                    className="w-4 h-4 text-mono-primary rounded border-mono-primary/30 focus:ring-mono-accent"
                                />
                                <label htmlFor="useCustomDefault" className="text-sm text-mono-text cursor-pointer">
                                    Use custom default response
                                </label>
                            </div>

                            {useCustomDefault ? (
                                <input
                                    type="text"
                                    value={customDefault}
                                    onChange={(e) => setCustomDefault(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-xl border bg-mono-bg focus:outline-none transition-all ${showErrors && !(customDefault || '').trim()
                                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                        : 'border-mono-primary/20 focus:border-mono-primary focus:ring-1 focus:ring-mono-primary'
                                        }`}
                                    placeholder="e.g., I don't know, N/A"
                                />
                            ) : (
                                <select
                                    value={defaultResponse}
                                    onChange={(e) => setDefaultResponse(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-xl border bg-mono-bg focus:outline-none transition-all ${showErrors && !defaultResponse
                                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                                        : 'border-mono-primary/20 focus:border-mono-primary focus:ring-1 focus:ring-mono-primary'
                                        }`}
                                >
                                    <option value="">Select from options</option>
                                    {options.filter(o => o.trim()).map((option, index) => (
                                        <option key={index} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {showErrors && !currentDefaultResponse && (
                                <p className="text-red-500 text-xs mt-1">Default response is required</p>
                            )}
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 border border-mono-primary/10 rounded-xl bg-mono-primary/5">
                                <input
                                    type="checkbox"
                                    id="showDefault"
                                    checked={showDefaultToConsumers}
                                    onChange={(e) => setShowDefaultToConsumers(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-mono-primary rounded border-mono-primary/30 focus:ring-mono-accent"
                                />
                                <label htmlFor="showDefault" className="text-mono-text text-sm">
                                    <span className="font-medium">Show default to consumers</span>
                                    <p className="text-mono-text/60 mt-0.5">
                                        Consumers will see what response will be recorded if they don't submit
                                    </p>
                                </label>
                            </div>

                            <div className="flex items-start gap-3 p-4 border border-mono-primary/10 rounded-xl bg-mono-primary/5">
                                <input
                                    type="checkbox"
                                    id="persistent"
                                    checked={isPersistentFinalAlert}
                                    onChange={(e) => setIsPersistentFinalAlert(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-mono-primary rounded border-mono-primary/30 focus:ring-mono-accent"
                                />
                                <label htmlFor="persistent" className="text-mono-text text-sm">
                                    <span className="font-medium">Make final alert (1 min) persistent</span>
                                    <p className="text-mono-text/60 mt-0.5">
                                        The 1-minute warning will require action before it can be dismissed
                                    </p>
                                </label>
                            </div>

                            <div className="flex items-start gap-3 p-4 border border-mono-primary/10 rounded-xl bg-mono-primary/5">
                                <input
                                    type="checkbox"
                                    id="republish"
                                    checked={republish}
                                    onChange={(e) => setRepublish(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-mono-primary rounded border-mono-primary/30 focus:ring-mono-accent"
                                />
                                <label htmlFor="republish" className="text-mono-text text-sm">
                                    <span className="font-medium">Republish Poll</span>
                                    <p className="text-mono-text/60 mt-0.5">
                                        If enabled, <strong>all existing responses will be deleted</strong> and consumers must submit again.
                                    </p>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-mono-text mb-2 font-medium">Deadline <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-xl border bg-mono-bg focus:outline-none focus:ring-1 transition-all ${(showErrors || hasChanges) && !isDateValid(deadline)
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-mono-primary/20 focus:border-mono-primary focus:ring-mono-primary'
                                        }`}
                                    min={getMinDateTime()}
                                />
                                {showErrors && !isDateValid(deadline) && (
                                    <p className="text-red-500 text-xs mt-1">Deadline must be in the future</p>
                                )}
                                <p className="text-sm text-mono-text/60 mt-2">
                                    Notifications will be sent at 60, 30, 15, and 1 minute before deadline
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Anonymity Mode */}
                    <div>
                        <label className="block text-mono-text mb-3 font-medium">
                            Response Tracking <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 border border-mono-primary/20 rounded-xl cursor-pointer hover:bg-mono-primary/5 transition-colors bg-mono-primary/5">
                                <input
                                    type="radio"
                                    name="anonymity"
                                    checked={anonymityMode === 'record'}
                                    onChange={() => setAnonymityMode('record')}
                                    className="w-4 h-4 text-mono-primary"
                                />
                                <div>
                                    <p className="text-mono-text font-medium">Record Responses</p>
                                    <p className="text-sm text-mono-text/60">
                                        You will see individual consumer emails and their responses
                                    </p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-mono-primary/20 rounded-xl cursor-pointer hover:bg-mono-primary/5 transition-colors bg-mono-primary/5">
                                <input
                                    type="radio"
                                    name="anonymity"
                                    checked={anonymityMode === 'anonymous'}
                                    onChange={() => setAnonymityMode('anonymous')}
                                    className="w-4 h-4 text-mono-primary"
                                />
                                <div>
                                    <p className="text-mono-text font-medium">Anonymous</p>
                                    <p className="text-sm text-mono-text/60">
                                        Responses will be anonymous - you won't see who responded
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Consumers */}
                    <div>
                        <label className="block text-mono-text mb-3 font-medium">
                            Consumers <span className="text-red-500">*</span>
                            <span className="text-sm text-mono-text/60 ml-2">
                                ({selectedConsumers.length} selected)
                            </span>
                        </label>

                        <div className="mb-3">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-mono-primary/20 rounded-xl cursor-pointer hover:bg-mono-primary/5 transition-colors shadow-sm">
                                    <Upload className="w-4 h-4 text-mono-text/60" />
                                    <span className="text-sm text-mono-text">Import from Excel/CSV</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                </label>
                                {isUploading && <span className="text-sm text-mono-text/60">Processing...</span>}
                                {uploadStats && (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Added {uploadStats.new} new emails
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-mono-text/60 mt-1 ml-1">
                                Supports .xlsx, .xls, .csv. Will extract any valid emails found.
                            </p>
                        </div>

                        <div className="border border-mono-primary/20 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 bg-mono-bg">
                            {/* Show uploaded consumers first */}
                            {selectedConsumers
                                .filter(email => !availableConsumers.includes(email))
                                .map(email => (
                                    <label
                                        key={email}
                                        className="flex items-center gap-3 p-2 hover:bg-mono-primary/5 rounded-lg cursor-pointer transition-colors bg-blue-50/50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => handleToggleConsumer(email)}
                                            className="w-4 h-4 text-mono-primary rounded border-mono-primary/30 focus:ring-mono-accent"
                                        />
                                        <span className="text-mono-text">{email}</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                            Imported
                                        </span>
                                    </label>
                                ))}

                            {availableConsumers.map(email => (
                                <label
                                    key={email}
                                    className="flex items-center gap-3 p-2 hover:bg-mono-primary/5 rounded-lg cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedConsumers.includes(email)}
                                        onChange={() => handleToggleConsumer(email)}
                                        className="w-4 h-4 text-mono-primary rounded border-mono-primary/30 focus:ring-mono-accent"
                                    />
                                    <span className="text-mono-text">{email}</span>
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
                            <div className="flex items-start gap-2 p-3 bg-mono-primary/5 border border-mono-primary/10 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-mono-text/60 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-mono-text/70">
                                    Make changes to enable saving
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-mono-primary/10 p-6 bg-mono-bg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-mono-primary/5 text-mono-text rounded-xl hover:bg-mono-primary/10 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium min-w-[140px] justify-center"
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
