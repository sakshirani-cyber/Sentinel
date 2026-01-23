import { useState, useEffect, useMemo } from 'react';
import { 
  Send, CheckCircle, XCircle, AlertCircle, Clock, 
  Loader2, AlertTriangle, MessageSquare, Lock
} from 'lucide-react';
import { Poll, Response } from '../../types';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface SignalRowExpandedProps {
  poll: Poll;
  userResponse?: Response;
  draft?: string;
  currentUserEmail: string;
  onSubmitResponse?: (pollId: string, value: string) => Promise<void>;
  onSaveDraft?: (pollId: string, value: string) => void;
}

/**
 * SignalRowExpanded Component
 * 
 * The expanded inline content showing:
 * - Full signal details and options
 * - Response form (if eligible to respond)
 * - Submitted response (if already responded)
 * - Read-only view (if creator but not in audience)
 */
export default function SignalRowExpanded({
  poll,
  userResponse,
  draft,
  currentUserEmail,
  onSubmitResponse,
  onSaveDraft,
}: SignalRowExpandedProps) {
  const [selectedValue, setSelectedValue] = useState(draft || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);

  // Fetch labels for LabelText display
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

  // Eligibility calculations
  const isCreator = poll.publisherEmail.toLowerCase() === currentUserEmail.toLowerCase();
  const isInAudience = poll.consumers.some(
    (c: string) => c.toLowerCase() === currentUserEmail.toLowerCase()
  );
  const isExpired = useMemo(() => {
    return poll.status === 'completed' || new Date(poll.deadline) < new Date();
  }, [poll.deadline, poll.status]);
  const hasResponded = !!userResponse;

  // Can respond if in audience, not responded, and not expired
  const canRespond = isInAudience && !hasResponded && !isExpired;

  // Read-only if creator but not in audience
  const isReadOnly = isCreator && !isInAudience;

  // Auto-save draft
  useEffect(() => {
    if (!canRespond || !onSaveDraft) return;
    
    const interval = setInterval(() => {
      if (selectedValue) {
        onSaveDraft(poll.id, selectedValue);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedValue, poll.id, onSaveDraft, canRespond]);

  const handleSubmit = () => {
    if (selectedValue && canRespond) {
      setShowConfirmation(true);
    }
  };

  const confirmSubmit = async () => {
    if (!onSubmitResponse) return;
    setIsSubmitting(true);
    try {
      await onSubmitResponse(poll.id, selectedValue);
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
      {/* Read-Only Notice (for creators not in audience) */}
      {isReadOnly && (
        <div className="mb-4 p-3 bg-ribbit-dry-sage/20 dark:bg-ribbit-hunter-green/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-ribbit-hunter-green dark:text-ribbit-dry-sage">
            <Lock className="w-4 h-4" />
            <span className="font-medium">You created this signal but are not a recipient.</span>
          </div>
          <p className="text-xs text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 mt-1 ml-6">
            You can view the details but cannot submit a response.
          </p>
        </div>
      )}

      {/* Expired Notice */}
      {isExpired && !hasResponded && isInAudience && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                This signal has expired
              </p>
              {poll.defaultResponse && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Your response was recorded as: <strong>"{poll.defaultResponse}"</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submitted Response Display */}
      {hasResponded && userResponse && (
        <div className={`mb-4 p-4 rounded-lg border ${
          userResponse.isDefault 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : userResponse.skipReason
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        }`}>
          <div className="flex items-start gap-3">
            {userResponse.isDefault ? (
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            ) : userResponse.skipReason ? (
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                userResponse.isDefault || userResponse.skipReason
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}>
                {userResponse.isDefault 
                  ? 'Default response was recorded'
                  : userResponse.skipReason
                    ? 'You skipped this signal'
                    : 'Your response was recorded'
                }
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                  <span className="opacity-60">Response:</span>{' '}
                  <span className="font-medium">{userResponse.response}</span>
                </p>
                {userResponse.skipReason && (
                  <p className="text-sm text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                    <span className="opacity-60">Reason:</span> {userResponse.skipReason}
                  </p>
                )}
                <p className="text-xs text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
                  {formatDateTime(userResponse.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Options */}
      <div className="mb-4">
        <p className="text-sm font-medium text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {canRespond ? 'Select your response' : 'Response options'}
        </p>
        <div className="space-y-2">
          {poll.options.map((option, index) => {
            const isSelected = hasResponded 
              ? userResponse?.response === option.text 
              : selectedValue === option.text;
            const isDisabled = !canRespond;

            return (
              <label
                key={option.id || index}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border
                  ${isSelected
                    ? 'bg-ribbit-fern/10 dark:bg-ribbit-fern/20 border-ribbit-fern dark:border-ribbit-dry-sage'
                    : 'bg-white dark:bg-ribbit-hunter-green/40 border-ribbit-fern/10 dark:border-ribbit-dry-sage/10'
                  }
                  ${canRespond 
                    ? 'cursor-pointer hover:border-ribbit-fern/50 dark:hover:border-ribbit-dry-sage/50' 
                    : 'cursor-default'
                  }
                  ${isDisabled && !isSelected ? 'opacity-60' : ''}
                `}
              >
                {/* Radio Circle */}
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  transition-colors
                  ${isSelected
                    ? 'border-ribbit-fern dark:border-ribbit-dry-sage bg-ribbit-fern dark:bg-ribbit-dry-sage'
                    : 'border-ribbit-fern/30 dark:border-ribbit-dry-sage/30'
                  }
                `}>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-ribbit-hunter-green" />
                  )}
                </div>

                {canRespond && (
                  <input
                    type="radio"
                    name={`poll-response-${poll.id}`}
                    value={option.text}
                    checked={selectedValue === option.text}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="hidden"
                  />
                )}

                <span className={`
                  flex-1 text-sm transition-colors
                  ${isSelected
                    ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage font-medium'
                    : 'text-ribbit-pine-teal dark:text-ribbit-dust-grey'
                  }
                `}>
                  {option.text}
                </span>

                {/* Option letter badge */}
                <span className="text-xs text-ribbit-pine-teal/30 dark:text-ribbit-dust-grey/30 font-mono">
                  {String.fromCharCode(65 + index)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Default Response Info (for eligible responders) */}
      {canRespond && poll.showDefaultToConsumers && poll.defaultResponse && (
        <div className="mb-4 p-3 bg-ribbit-dry-sage/20 dark:bg-ribbit-hunter-green/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-ribbit-fern dark:text-ribbit-dry-sage flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">
                Default response if you don't respond:
              </p>
              <p className="text-sm text-ribbit-pine-teal dark:text-ribbit-dust-grey mt-1 font-medium">
                "{poll.defaultResponse}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Alert Warning */}
      {canRespond && poll.isPersistentFinalAlert && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Mandatory final alert enabled
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                You'll receive a persistent alert 1 minute before deadline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button (for eligible responders) */}
      {canRespond && (
        <button
          onClick={handleSubmit}
          disabled={!selectedValue}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-3
            bg-ribbit-hunter-green hover:bg-ribbit-pine-teal
            dark:bg-ribbit-dry-sage dark:hover:bg-ribbit-fern
            text-white dark:text-ribbit-hunter-green
            rounded-lg font-semibold
            shadow-md hover:shadow-lg
            transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
          "
        >
          <Send className="w-4 h-4" />
          Submit Response
        </button>
      )}

      {/* Status Footer for already responded or expired */}
      {hasResponded && (
        <div className="flex items-center justify-center gap-2 py-2 text-ribbit-fern dark:text-ribbit-dry-sage">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Response recorded</span>
        </div>
      )}

      {isExpired && !hasResponded && isInAudience && (
        <div className="flex items-center justify-center gap-2 py-2 text-red-500">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Responses closed</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowConfirmation(false)}
        >
          <div 
            className="
              bg-white dark:bg-ribbit-hunter-green
              rounded-xl shadow-2xl max-w-md w-full
              overflow-hidden
              border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20
              animate-scale-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 text-center border-b border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
              <div className="w-14 h-14 bg-ribbit-fern/10 dark:bg-ribbit-dry-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-ribbit-fern dark:text-ribbit-dry-sage" />
              </div>
              <h3 className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dust-grey mb-1">
                Confirm Response
              </h3>
              <p className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
                Please review your selection
              </p>
            </div>

            {/* Selected Response */}
            <div className="p-6 bg-ribbit-dry-sage/10 dark:bg-ribbit-pine-teal/20">
              <p className="text-xs uppercase tracking-wider text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 mb-2">
                Your response
              </p>
              <div className="p-4 bg-white dark:bg-ribbit-hunter-green/60 rounded-lg border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20">
                <p className="text-ribbit-hunter-green dark:text-ribbit-dry-sage font-medium">
                  {selectedValue}
                </p>
              </div>
              <p className="text-xs text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40 mt-3 text-center">
                This action cannot be undone
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 flex gap-3 border-t border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
              <button
                onClick={() => setShowConfirmation(false)}
                className="
                  flex-1 px-4 py-2.5
                  bg-ribbit-dust-grey dark:bg-ribbit-pine-teal
                  text-ribbit-hunter-green dark:text-ribbit-dust-grey
                  rounded-lg font-medium
                  hover:bg-ribbit-dry-sage dark:hover:bg-ribbit-fern/30
                  transition-colors
                "
              >
                Go Back
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="
                  flex-1 px-4 py-2.5
                  bg-ribbit-hunter-green dark:bg-ribbit-dry-sage
                  hover:bg-ribbit-pine-teal dark:hover:bg-ribbit-fern
                  text-white dark:text-ribbit-hunter-green
                  rounded-lg font-medium
                  flex items-center justify-center gap-2
                  shadow-md hover:shadow-lg
                  disabled:opacity-50
                  transition-all
                "
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
