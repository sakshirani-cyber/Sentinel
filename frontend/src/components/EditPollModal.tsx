import { useState } from 'react';
import { Poll } from '../App';
import { Plus, X, Save, AlertCircle } from 'lucide-react';

interface EditPollModalProps {
    poll: Poll;
    onUpdate: (pollId: string, updates: Partial<Poll>) => void;
    onClose: () => void;
}

export default function EditPollModal({ poll, onUpdate, onClose }: EditPollModalProps) {
    const [question, setQuestion] = useState(poll.question);
    const [options, setOptions] = useState<string[]>(poll.options.map(o => o.text));
    const [defaultResponse, setDefaultResponse] = useState(poll.defaultResponse);
    const [showDefaultToConsumers, setShowDefaultToConsumers] = useState(poll.showDefaultToConsumers);
    const [anonymityMode, setAnonymityMode] = useState<'anonymous' | 'record'>(poll.anonymityMode);
    const [deadline, setDeadline] = useState(poll.deadline.slice(0, 16)); // Format for datetime-local
    const [alertBeforeMinutes, setAlertBeforeMinutes] = useState(poll.alertBeforeMinutes);
    const [isPersistentAlert, setIsPersistentAlert] = useState(poll.isPersistentAlert);
    const [selectedConsumers, setSelectedConsumers] = useState<string[]>(poll.consumers);

    // Mock consumers list - in real app, this would come from backend or props
    // For now, we'll just use the ones already in the poll plus some extras if needed
    // Or better, just assume the current list is what we have to work with + maybe we can't add new ones easily without the full list
    // Let's just use the poll's consumers for now to avoid complexity, or pass availableConsumers as prop.
    // To keep it simple and working, I'll just allow removing existing consumers.
    // Actually, the user might want to add consumers. I'll re-use the list from CreatePoll if possible, 
    // but since I don't have it passed down, I'll just use the poll's consumers + a few hardcoded ones for demo.
    const availableConsumers = Array.from(new Set([
        ...poll.consumers,
        'alice@company.com',
        'bob@company.com',
        'charlie@company.com',
        'diana@company.com',
        'eve@company.com'
    ]));

    const handleAddOption = () => {
        setOptions([...options, '']);
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

    const handleSave = () => {
        const validOptions = options.filter(o => o.trim());

        const updates: Partial<Poll> = {
            question,
            options: validOptions.map((text, index) => ({
                id: `opt-${index}`, // Regenerate IDs to keep it simple
                text
            })),
            defaultResponse,
            showDefaultToConsumers,
            anonymityMode,
            deadline,
            alertBeforeMinutes,
            isPersistentAlert,
            consumers: selectedConsumers,
            isEdited: true
        };

        onUpdate(poll.id, updates);
        onClose();
    };

    const isValid =
        question.trim() &&
        options.filter(o => o.trim()).length >= 2 &&
        defaultResponse &&
        deadline &&
        selectedConsumers.length > 0;

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
                            className="w-full px-4 py-3 rounded-xl border border-mono-primary/20 bg-mono-bg focus:outline-none focus:border-mono-primary focus:ring-1 focus:ring-mono-primary transition-all"
                        />
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
                                        className="flex-1 px-4 py-2 rounded-xl border border-mono-primary/20 bg-mono-bg focus:outline-none focus:border-mono-primary focus:ring-1 focus:ring-mono-primary transition-all"
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
                            <button
                                onClick={handleAddOption}
                                className="flex items-center gap-2 px-4 py-2 text-mono-primary hover:bg-mono-primary/5 rounded-xl transition-colors font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add Option
                            </button>
                        </div>
                    </div>

                    {/* Default Response */}
                    <div>
                        <label className="block text-mono-text mb-2 font-medium">
                            Default Response <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={defaultResponse}
                            onChange={(e) => setDefaultResponse(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-mono-primary/20 bg-mono-bg focus:outline-none focus:border-mono-primary focus:ring-1 focus:ring-mono-primary transition-all"
                        >
                            <option value="">Select from options</option>
                            {options.filter(o => o.trim()).map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
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
                                    checked={isPersistentAlert}
                                    onChange={(e) => setIsPersistentAlert(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-mono-primary rounded border-mono-primary/30 focus:ring-mono-accent"
                                />
                                <label htmlFor="persistent" className="text-mono-text text-sm">
                                    <span className="font-medium">Make alert persistent</span>
                                    <p className="text-mono-text/60 mt-0.5">
                                        Consumers must provide a reason to skip this notification
                                    </p>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-mono-text mb-2 font-medium">Deadline</label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-mono-primary/20 bg-mono-bg focus:outline-none focus:border-mono-primary focus:ring-1 focus:ring-mono-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-mono-text mb-2 font-medium">Alert Before</label>
                                <select
                                    value={alertBeforeMinutes}
                                    onChange={(e) => setAlertBeforeMinutes(Number(e.target.value))}
                                    className="w-full px-4 py-2 rounded-xl border border-mono-primary/20 bg-mono-bg focus:outline-none focus:border-mono-primary focus:ring-1 focus:ring-mono-primary transition-all"
                                >
                                    <option value={5}>5 minutes</option>
                                    <option value={10}>10 minutes</option>
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={120}>2 hours</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Consumers */}
                    <div>
                        <label className="block text-mono-text mb-3 font-medium">
                            Consumers <span className="text-red-500">*</span>
                        </label>
                        <div className="border border-mono-primary/20 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 bg-mono-bg">
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
                    </div>

                    {!isValid && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                Please ensure all required fields are filled correctly
                            </p>
                        </div>
                    )}
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
                        disabled={!isValid}
                        className="flex items-center gap-2 px-6 py-3 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
