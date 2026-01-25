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
    <div className="mt-4 pt-4 border-t border-border">
      {/* Read-Only Notice (for creators not in audience) */}
      {isReadOnly && (
        <div className="mb-4 p-3 bg-secondary dark:bg-secondary border border-border rounded-lg">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Lock className="w-4 h-4" />
            <span className="font-medium">You created this signal but are not a recipient.</span>
          </div>
          <p className="text-xs text-foreground-muted mt-1 ml-6">
            You can view the details but cannot submit a response.
          </p>
        </div>
      )}

      {/* Expired Notice */}
      {isExpired && !hasResponded && isInAudience && (
        <div className="mb-4 p-3 bg-destructive/10 dark:bg-destructive/15 border border-destructive/30 rounded-lg">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                This signal has expired
              </p>
              {poll.defaultResponse && (
                <p className="text-xs text-destructive/80 mt-1">
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
            ? 'bg-warning/10 dark:bg-warning/15 border-warning/30'
            : userResponse.skipReason
              ? 'bg-warning/10 dark:bg-warning/15 border-warning/30'
              : 'bg-success/10 dark:bg-success/15 border-success/30'
        }`}>
          <div className="flex items-start gap-3">
            {userResponse.isDefault ? (
              <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            ) : userResponse.skipReason ? (
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                userResponse.isDefault || userResponse.skipReason
                  ? 'text-warning'
                  : 'text-success'
              }`}>
                {userResponse.isDefault 
                  ? 'Default response was recorded'
                  : userResponse.skipReason
                    ? 'You skipped this signal'
                    : 'Your response was recorded'
                }
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-foreground">
                  <span className="opacity-60">Response:</span>{' '}
                  <span className="font-medium">{userResponse.response}</span>
                </p>
                {userResponse.skipReason && (
                  <p className="text-sm text-foreground">
                    <span className="opacity-60">Reason:</span> {userResponse.skipReason}
                  </p>
                )}
                <p className="text-xs text-foreground-muted">
                  {formatDateTime(userResponse.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Options */}
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground-secondary mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {canRespond ? 'Select your response' : 'Response options'}
        </p>
        <div className="space-y-2">
          {poll.options.map((option, index) => {
            const isSelected = hasResponded 
              ? userResponse?.response === option.text 
              : selectedValue === option.text;
            const isDisabled = !canRespond;

            const handleOptionClick = () => {
              if (canRespond) {
                setSelectedValue(option.text);
              }
            };

            return (
              <div
                key={option.id || index}
                onClick={handleOptionClick}
                role="button"
                tabIndex={canRespond ? 0 : -1}
                onKeyDown={(e) => {
                  if (canRespond && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleOptionClick();
                  }
                }}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border
                  transition-all duration-200 ease-in-out
                  ${isSelected
                    ? 'bg-primary/15 dark:bg-primary/25 border-primary shadow-sm ring-1 ring-primary/20'
                    : 'bg-card dark:bg-secondary border-border'
                  }
                  ${canRespond 
                    ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 active:scale-[0.99]' 
                    : 'cursor-default'
                  }
                  ${isDisabled && !isSelected ? 'opacity-60' : ''}
                `}
              >
                {/* Radio Circle */}
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  transition-all duration-200
                  ${isSelected
                    ? 'border-primary bg-primary scale-110'
                    : 'border-muted-foreground/40 dark:border-muted-foreground/30'
                  }
                `}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground animate-scale-in" />
                  )}
                </div>

                {/* Hidden radio input for form semantics */}
                {canRespond && (
                  <input
                    type="radio"
                    name={`poll-response-${poll.id}`}
                    value={option.text}
                    checked={selectedValue === option.text}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="sr-only"
                    aria-label={option.text}
                  />
                )}

                <span className={`
                  flex-1 text-sm transition-all duration-200
                  ${isSelected
                    ? 'text-primary font-semibold'
                    : 'text-foreground'
                  }
                `}>
                  {option.text}
                </span>

                {/* Option letter badge */}
                <span className={`
                  text-xs font-mono px-2 py-0.5 rounded transition-all duration-200
                  ${isSelected
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-foreground-muted'
                  }
                `}>
                  {String.fromCharCode(65 + index)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Default Response Info (for eligible responders) */}
      {canRespond && poll.showDefaultToConsumers && poll.defaultResponse && (
        <div className="mb-4 p-3 bg-secondary dark:bg-secondary border border-border rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">
                Default response if you don't respond:
              </p>
              <p className="text-sm text-foreground mt-1 font-medium">
                "{poll.defaultResponse}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Alert Warning */}
      {canRespond && poll.isPersistentFinalAlert && (
        <div className="mb-4 p-3 bg-warning/10 dark:bg-warning/15 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">
                Mandatory final alert enabled
              </p>
              <p className="text-xs text-warning/80 mt-1">
                You'll receive a persistent alert 15 minutes before deadline.
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
            bg-primary hover:bg-primary-hover
            text-primary-foreground
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
        <div className="flex items-center justify-center gap-2 py-2 text-primary">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Response recorded</span>
        </div>
      )}

      {isExpired && !hasResponded && isInAudience && (
        <div className="flex items-center justify-center gap-2 py-2 text-destructive">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Responses closed</span>
        </div>
      )}

      {/* Confirmation Modal - Opaque background */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setShowConfirmation(false)}
        >
          <div 
            className="
              bg-background dark:bg-background
              rounded-xl shadow-2xl max-w-md w-full
              overflow-hidden
              border border-border dark:border-border
              animate-scale-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 text-center border-b border-border bg-card-solid dark:bg-card-solid">
              <div className="w-14 h-14 bg-primary/15 dark:bg-primary/25 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-1">
                Confirm Response
              </h3>
              <p className="text-sm text-foreground-muted dark:text-foreground-muted">
                Please review your selection
              </p>
            </div>

            {/* Selected Response */}
            <div className="p-6 bg-secondary dark:bg-muted">
              <p className="text-xs uppercase tracking-wider text-foreground-muted dark:text-foreground-muted mb-2 font-medium">
                Your response
              </p>
              <div className="p-4 bg-card-solid dark:bg-card-solid rounded-lg border border-border dark:border-border shadow-sm">
                <p className="text-primary font-semibold text-base">
                  {selectedValue}
                </p>
              </div>
              <p className="text-xs text-foreground-muted dark:text-foreground-muted mt-3 text-center">
                This action cannot be undone
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 flex gap-3 border-t border-border bg-card-solid dark:bg-card-solid">
              <button
                onClick={() => setShowConfirmation(false)}
                className="
                  flex-1 px-4 py-2.5
                  bg-muted dark:bg-secondary
                  text-foreground dark:text-foreground
                  rounded-lg font-medium
                  hover:bg-muted/80 dark:hover:bg-secondary/80
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
                  bg-primary hover:bg-primary-hover
                  text-primary-foreground
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
