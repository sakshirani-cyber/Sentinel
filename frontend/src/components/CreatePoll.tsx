import { useState } from 'react';
import { User, Poll, PollOption } from '../App';
import { Plus, X, Eye, Check, AlertCircle } from 'lucide-react';
import PollPreview from './PollPreview';

interface CreatePollProps {
  user: User;
  onCreatePoll: (poll: Poll) => void;
  existingPolls: Poll[];
  formType?: string;
}

export default function CreatePoll({ user, onCreatePoll, existingPolls, formType }: CreatePollProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [defaultResponse, setDefaultResponse] = useState('');
  const [customDefault, setCustomDefault] = useState('');
  const [useCustomDefault, setUseCustomDefault] = useState(false);
  const [showDefaultToConsumers, setShowDefaultToConsumers] = useState(false);
  const [anonymityMode, setAnonymityMode] = useState<'anonymous' | 'record'>('record');
  const [deadline, setDeadline] = useState('');
  const [isPersistentFinalAlert, setIsPersistentFinalAlert] = useState(false);
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Set minimum datetime to current time
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  // Mock consumers list - in real app, this would come from backend
  const availableConsumers = [
    'alice@company.com',
    'bob@company.com',
    'charlie@company.com',
    'diana@company.com',
    'eve@company.com',
    user.email
  ];

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

  // Check for duplicate options (case-insensitive)
  const hasDuplicateOptions = () => {
    const validOptions = options.filter(o => o.trim()).map(o => o.trim().toLowerCase());
    const uniqueOptions = new Set(validOptions);
    return uniqueOptions.size !== validOptions.length;
  };

  const handlePublish = () => {
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
      deadline,
      isPersistentFinalAlert,
      consumers: selectedConsumers,
      publishedAt: new Date().toISOString(),
      status: 'active'
    };

    onCreatePoll(poll);

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setDefaultResponse('');
    setCustomDefault('');
    setUseCustomDefault(false);
    setShowDefaultToConsumers(false);
    setAnonymityMode('record');
    setDeadline('');
    setIsPersistentFinalAlert(false);
    setSelectedConsumers([]);
    setShowPreview(false);
  };

  const isDateValid = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date > new Date();
  };

  const isValid =
    question.trim() &&
    options.filter(o => o.trim()).length >= 2 &&
    !hasDuplicateOptions() &&
    (useCustomDefault ? customDefault.trim() : defaultResponse) &&
    isDateValid(deadline) &&
    selectedConsumers.length > 0;

  const canPreview =
    question.trim() &&
    options.filter(o => o.trim()).length >= 2 &&
    (useCustomDefault ? customDefault.trim() : defaultResponse) &&
    deadline;

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
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Are you on leave tomorrow?"
              autoFocus
            />
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
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
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
              <button
                onClick={handleAddOption}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Option
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
                  type="text"
                  value={customDefault}
                  onChange={(e) => setCustomDefault(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., I don't know, N/A, They are on leave tomorrow"
                />
              ) : (
                <select
                  value={defaultResponse}
                  onChange={(e) => setDefaultResponse(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select from options</option>
                  {options.filter(o => o.trim()).map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
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
                Make final alert (1 min before deadline) persistent
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
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={getMinDateTime()}
            />
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
            <div className="border border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
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
              disabled={!isValid}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
            >
              <Check className="w-4 h-4" />
              Publish Poll
            </button>
          </div>

          {!isValid && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p>Please ensure:</p>
                <ul className="list-disc list-inside ml-1">
                  {!question.trim() && <li>Question is filled</li>}
                  {options.filter(o => o.trim()).length < 2 && <li>At least 2 options are provided</li>}
                  {hasDuplicateOptions() && <li>Options don't have duplicates (case-insensitive)</li>}
                  {!(useCustomDefault ? customDefault.trim() : defaultResponse) && <li>Default response is selected</li>}
                  {!isDateValid(deadline) && <li>Deadline is in the future</li>}
                  {selectedConsumers.length === 0 && <li>At least one consumer is selected</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
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
            status: 'active'
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}