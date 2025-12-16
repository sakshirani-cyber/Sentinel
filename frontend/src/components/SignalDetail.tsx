
import { useState, useEffect } from 'react';
import { Poll } from '../App';
import { X, Send, AlertCircle, Clock, Shield, ArrowLeft } from 'lucide-react';

interface SignalDetailProps {
  poll: Poll;
  draft?: string;
  onSaveDraft: (pollId: string, value: string) => void;
  onSubmit: (pollId: string, value: string) => void;
  onClose: () => void;
  isPersistentContext?: boolean; // New prop to indicate if opened from persistent alert
}

export default function SignalDetail({ poll, draft, onSaveDraft, onSubmit, onClose, isPersistentContext = false }: SignalDetailProps) {
  const [selectedValue, setSelectedValue] = useState(draft || '');
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const confirmSubmit = () => {
    onSubmit(poll.id, selectedValue);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-mono-bg rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-mono-primary/10 animate-in zoom-in-95 duration-200">
        {/* Header - Pinned */}
        <div className="flex-shrink-0 bg-mono-primary/5 border-b border-mono-primary/10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-mono-text/60">From: {poll.publisherName}</span>
              </div>
              <h2 className="text-mono-text text-xl font-medium mb-2">{poll.question}</h2>
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
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Default Response Info */}
          {poll.showDefaultToConsumers && poll.defaultResponse && (
            <div className="mb-6 p-4 bg-mono-primary/5 border border-mono-primary/10 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-mono-primary/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-mono-text mb-1">
                    <strong>Default Response:</strong> {poll.defaultResponse}
                  </p>
                  <p className="text-xs text-mono-text/60">
                    This will be recorded if you don't submit a response before the deadline
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Poll Options */}
          <div className="space-y-3 mb-6">
            {poll.options.map((option) => (
              <label
                key={option.id}
                className={`group flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedValue === option.text
                  ? 'border-mono-accent bg-mono-accent/10 shadow-sm'
                  : 'border-mono-primary/10 hover:border-mono-accent/50 hover:bg-mono-bg'
                  }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedValue === option.text
                  ? 'border-mono-accent bg-mono-accent'
                  : 'border-mono-primary/30 group-hover:border-mono-accent'
                  }`}>
                  {selectedValue === option.text && (
                    <div className="w-2 h-2 bg-mono-primary rounded-full" />
                  )}
                </div>
                <input
                  type="radio"
                  name="poll-response"
                  value={option.text}
                  checked={selectedValue === option.text}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="hidden"
                />
                <span className={`font-medium transition-colors ${selectedValue === option.text ? 'text-mono-primary' : 'text-mono-text'
                  }`}>
                  {option.text}
                </span>
              </label>
            ))}
          </div>

          {/* Warning */}
          {poll.isPersistentFinalAlert && (
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
          <button
            onClick={handleSubmit}
            disabled={!selectedValue}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium"
          >
            <Send className="w-4 h-4" />
            Submit Response
          </button>
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
              <div className="mt-4 p-4 bg-mono-primary/5 rounded-xl border border-mono-primary/10">
                <p className="text-sm text-mono-text">
                  <strong>Your response:</strong> {selectedValue}
                </p>
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
                className="flex-1 px-4 py-3 bg-mono-primary text-mono-bg rounded-xl hover:bg-mono-primary/90 transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
