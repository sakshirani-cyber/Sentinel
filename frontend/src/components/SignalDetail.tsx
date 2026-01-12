
import { useState, useEffect } from 'react';
import { Poll, Response } from '../App';
import { X, Send, AlertCircle, Clock, Shield, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import LabelText from './LabelText';
// import LabelPill from './LabelPill';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface SignalDetailProps {
  poll: Poll;
  draft?: string;
  onSaveDraft: (pollId: string, value: string) => void;
  onSubmit: (pollId: string, value: string) => Promise<void>;
  onClose: () => void;
  isPersistentContext?: boolean;
  userResponse?: Response | null;
}

export default function SignalDetail({
  poll,
  draft,
  onSaveDraft,
  onSubmit,
  onClose,
  isPersistentContext = false,
  userResponse = null
}: SignalDetailProps) {
  const [selectedValue, setSelectedValue] = useState(draft || '');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      if (selectedValue) {
        onSaveDraft(poll.id, selectedValue);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedValue, poll.id, onSaveDraft]);



  const handleSubmit = () => {
    if (selectedValue) {
      setShowConfirmation(true);
    }
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(poll.id, selectedValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className={`fixed inset-0 ${isPersistentContext ? 'bg-black' : 'bg-black/50 backdrop-blur-sm'} flex items-center justify-center p-4 z-50 animate-in fade-in duration-200`}>
      <div className="bg-mono-bg rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-x-hidden overflow-y-auto flex flex-col border border-mono-primary/10 animate-in zoom-in-95 duration-200">
        {/* Header - Pinned */}
        <div className="flex-shrink-0 bg-mono-primary/5 border-b border-mono-primary/10 p-6 overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-mono-text/60">From: {poll.publisherName}</span>
              </div>
              <h2 className="text-mono-text text-xl font-medium mb-2 break-all whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                <LabelText text={poll.question} labels={labels} />
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/10 rounded-lg transition-colors flex items-center gap-2"
            >
              {isPersistentContext ? (
                <>
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm">Back</span>
                </>
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-mono-text/60 bg-mono-bg px-3 py-1 rounded-full border border-mono-primary/10">
              <Clock className="w-4 h-4" />
              <span>Deadline: {formatDateTime(poll.deadline)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-mono-text/60 bg-mono-bg px-3 py-1 rounded-full border border-mono-primary/10">
              <Shield className="w-4 h-4" />
              <span className="capitalize">{poll.anonymityMode}</span>
            </div>
            <span className={`px-3 py-1 rounded-full border ${getTimeRemaining().includes('Expired') || getTimeRemaining().includes('m remaining')
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
              {getTimeRemaining()}
            </span>
          </div>

          {/* Labels */}
          {/*
          {poll.labels && poll.labels.length > 0 && (
            <div className="mt-3">
              <LabelPill labels={poll.labels} />
            </div>
          )}
          */}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Poll Options */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-mono-text/60 mb-2">Options</p>
            {poll.options.map((option, index) => {
              const isSelected = userResponse ? userResponse.response === option.text : selectedValue === option.text;
              return (
                <label
                  key={option.id || index}
                  className={`group flex items-center gap-4 p-4 border-2 rounded-xl transition-all duration-200 overflow-hidden ${isSelected
                    ? 'border-mono-accent bg-mono-accent/10 shadow-sm'
                    : 'border-mono-primary/10'
                    } ${!userResponse ? 'cursor-pointer hover:border-mono-accent/50 hover:bg-mono-bg' : 'cursor-default'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                    ? 'border-mono-accent bg-mono-accent'
                    : 'border-mono-primary/30'
                    }`}>
                    {isSelected && (
                      <div className="w-2 h-2 bg-mono-primary rounded-full" />
                    )}
                  </div>
                  {!userResponse && (
                    <input
                      type="radio"
                      name="poll-response"
                      value={option.text}
                      checked={selectedValue === option.text}
                      onChange={(e) => setSelectedValue(e.target.value)}
                      className="hidden"
                    />
                  )}
                  <span className={`font-medium transition-colors break-all min-w-0 whitespace-pre-wrap max-w-full ${isSelected ? 'text-mono-primary' : 'text-mono-text'}`} style={{ wordBreak: 'break-all' }}>
                    <LabelText text={option.text} labels={labels} />
                  </span>
                </label>
              );
            })}
          </div>

          {/* User Response Details if completed */}
          {userResponse && (
            <div className="mb-6 p-4 bg-mono-accent/5 border border-mono-accent/20 rounded-xl">
              <h4 className="text-sm font-medium text-mono-primary mb-2">Your Response Details</h4>
              <div className="space-y-2 text-sm">
                <p className="text-mono-text break-all"><span className="opacity-60">Selected:</span> <LabelText text={userResponse.response} labels={labels} /></p>
                {userResponse.skipReason && <p className="text-mono-text"><span className="opacity-60">Reason for skipping:</span> {userResponse.skipReason}</p>}
                <p className="text-mono-text"><span className="opacity-60">Submitted:</span> {formatDateTime(userResponse.submittedAt)}</p>
                {userResponse.isDefault && <p className="text-amber-600 font-medium italic">This was recorded as a default response.</p>}
              </div>
            </div>
          )}

          {/* Default Response Info */}
          {poll.showDefaultToConsumers && poll.defaultResponse && (
            <div className="mb-6 p-4 bg-mono-primary/5 border border-mono-primary/10 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-mono-primary/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-mono-text mb-1">
                    <strong className="break-all max-w-full" style={{ wordBreak: 'break-all' }}>Default Response:</strong> <span className="break-all whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                      <LabelText text={poll.defaultResponse} labels={labels} />
                    </span>
                  </p>
                  <p className="text-xs text-mono-text/60">
                    This will be recorded if you don't submit a response before the deadline
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {!userResponse && poll.isPersistentFinalAlert && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900 font-medium">
                    Persistent Alert
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    You will receive a mandatory alert 1 minute before the deadline.
                    You must either submit or provide a reason to skip.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="flex-shrink-0 border-t border-mono-primary/10 p-6 bg-mono-bg">
          {userResponse ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-5 h-5" />
              Response Recorded
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!selectedValue}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium"
            >
              <Send className="w-4 h-4" />
              Submit Response
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200">
          <div className="bg-mono-bg rounded-2xl shadow-2xl max-w-md w-full p-6 border border-mono-primary/10 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-mono-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-mono-primary" />
              </div>
              <h3 className="text-mono-text text-lg font-medium mb-2">Confirm Submission</h3>
              <p className="text-mono-text/60">
                Are you sure you want to submit this response?
              </p>
              <div className="mt-4 p-4 bg-mono-primary/5 rounded-xl border border-mono-primary/10 text-center">
                <p className="text-sm text-mono-text/60 mb-2 font-medium">Your response:</p>
                <div className="text-mono-text text-lg">
                  <LabelText text={selectedValue} labels={labels} />
                </div>
              </div>
              <p className="text-xs text-mono-text/40 mt-3">
                This action cannot be undone
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 bg-mono-primary/5 text-mono-text rounded-xl hover:bg-mono-primary/10 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-mono-primary text-mono-bg rounded-xl hover:bg-mono-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
