import { useState } from 'react';
import { Poll } from '../App';
import { AlertTriangle, ArrowRight, SkipForward, Loader } from 'lucide-react';

interface PersistentAlertProps {
  poll: Poll;
  onSkip: (pollId: string, reason: string) => Promise<void>;
  onFill: () => void;
}

export default function PersistentAlert({ poll, onSkip, onFill }: PersistentAlertProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [isSkipping, setIsSkipping] = useState(false);

  const getMinutesRemaining = () => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes;
  };

  const handleSkip = async () => {
    if (skipReason.trim()) {
      setIsSkipping(true);
      try {
        await onSkip(poll.id, skipReason);
      } finally {
        setIsSkipping(false);
      }
    }
  };

  const minutesLeft = getMinutesRemaining();

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-8 overflow-hidden animate-pulse-slow">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white">Urgent: Response Required</h2>
              <p className="text-sm text-white/90">
                {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} left before deadline
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2 font-medium">From: {poll.publisherName}</p>
            <h3 className="text-gray-900 text-xl font-bold mb-4 leading-tight">{poll.question}</h3>

            {poll.showDefaultToConsumers && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <p className="text-sm text-amber-900">
                  <strong className="block mb-1">Default response will be recorded:</strong>
                  {poll.defaultResponse}
                </p>
              </div>
            )}
          </div>

          {!showReasonInput ? (
            <div className="space-y-4">
              <button
                onClick={onFill}
                className="w-full group bg-mono-primary text-mono-bg py-4 px-6 rounded-xl font-bold shadow-lg hover:bg-mono-accent hover:text-mono-primary transition-all duration-200 flex items-center justify-center gap-3"
              >
                <span>Fill Form</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setShowReasonInput(true)}
                className="w-full bg-mono-primary/5 text-mono-text py-4 px-6 rounded-xl font-semibold border-2 border-mono-primary/10 hover:bg-mono-primary/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip (Provide Reason)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Why are you skipping this signal? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-mono-primary/20 focus:outline-none focus:ring-4 focus:ring-mono-accent/20 focus:border-mono-accent bg-mono-primary/5 text-mono-text placeholder:text-mono-text/40 transition-all resize-none"
                  placeholder="Please provide a valid reason..."
                  rows={4}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setSkipReason('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSkip}
                  disabled={!skipReason.trim() || isSkipping}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2"
                >
                  {isSkipping ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Skipping...</span>
                    </>
                  ) : (
                    <span>Confirm Skip</span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              This notification cannot be dismissed without taking action
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
