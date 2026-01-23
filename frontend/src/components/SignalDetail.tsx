import { useState, useEffect, useMemo } from 'react';
import { Poll, Response } from '../types';
import { 
  X, Send, AlertCircle, Clock, Shield, ArrowLeft, Loader2, 
  CheckCircle, User, Calendar, AlertTriangle, XCircle, 
  MessageSquare, Users, Tag
} from 'lucide-react';
import LabelText from './LabelText';
import LabelPill from './LabelPill';

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

  // Check if poll is expired
  const isExpired = useMemo(() => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    return deadline < now;
  }, [poll.deadline]);

  // Can user respond?
  const canRespond = !userResponse && !isExpired;

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

  // Auto-save draft every 30 seconds (only if can respond)
  useEffect(() => {
    if (!canRespond) return;
    
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeInfo = useMemo(() => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) {
      const expiredAgo = Math.abs(diff);
      const days = Math.floor(expiredAgo / (1000 * 60 * 60 * 24));
      const hours = Math.floor((expiredAgo % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) return { text: `Expired ${days}d ago`, isExpired: true, isUrgent: false };
      if (hours > 0) return { text: `Expired ${hours}h ago`, isExpired: true, isUrgent: false };
      return { text: 'Just expired', isExpired: true, isUrgent: false };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isUrgent = diff < 1000 * 60 * 60; // Less than 1 hour

    if (days > 0) return { text: `${days}d ${hours}h left`, isExpired: false, isUrgent: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m left`, isExpired: false, isUrgent };
    return { text: `${minutes}m left`, isExpired: false, isUrgent: true };
  }, [poll.deadline]);

  // Get status for display
  const getStatus = () => {
    if (userResponse) {
      if (userResponse.isDefault) return { type: 'default', label: 'Default Recorded', color: 'amber' };
      if (userResponse.skipReason) return { type: 'skipped', label: 'Skipped', color: 'amber' };
      return { type: 'completed', label: 'Responded', color: 'green' };
    }
    if (isExpired) return { type: 'expired', label: 'Expired', color: 'red' };
    if (getTimeInfo.isUrgent) return { type: 'urgent', label: 'Urgent', color: 'red' };
    return { type: 'active', label: 'Awaiting Response', color: 'blue' };
  };

  const status = getStatus();

  return (
    <div className={`fixed inset-0 ${isPersistentContext ? 'bg-background' : 'bg-black/50 dark:bg-black/70 backdrop-blur-sm'} flex items-center justify-center p-4 z-50 animate-fade-in`}>
      <div className="bg-card dark:bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border scale-bounce">
        
        {/* Status Bar */}
        <div className={`
          px-4 py-2.5 text-center text-sm font-medium
          ${status.color === 'green' ? 'bg-success text-white' : ''}
          ${status.color === 'red' ? 'bg-destructive text-white' : ''}
          ${status.color === 'amber' ? 'bg-warning text-warning-foreground' : ''}
          ${status.color === 'blue' ? 'bg-primary text-primary-foreground' : ''}
        `}>
          <div className="flex items-center justify-center gap-2">
            {status.type === 'completed' && <CheckCircle className="w-4 h-4" />}
            {status.type === 'expired' && <XCircle className="w-4 h-4" />}
            {status.type === 'urgent' && <AlertTriangle className="w-4 h-4" />}
            {status.type === 'default' && <Clock className="w-4 h-4" />}
            {status.type === 'skipped' && <AlertCircle className="w-4 h-4" />}
            {status.type === 'active' && <MessageSquare className="w-4 h-4" />}
            {status.label}
          </div>
        </div>

        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-border">
          {/* Close Button - Top Right */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">From</p>
                <p className="font-medium text-foreground">{poll.publisherName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-foreground-secondary hover:text-foreground hover:bg-primary/10 dark:hover:bg-primary/15 rounded-xl transition-all active:scale-95"
              aria-label="Close"
            >
              {isPersistentContext ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>

          {/* Question */}
          <h2 className="text-xl font-semibold text-foreground leading-relaxed mb-4">
            <LabelText text={poll.question} labels={labels} />
          </h2>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Deadline */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted">Deadline</p>
                <p className="text-xs font-medium text-foreground truncate">
                  {new Date(poll.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Time Remaining */}
            <div className={`flex items-center gap-2 p-2.5 rounded-xl ${
              getTimeInfo.isExpired 
                ? 'bg-destructive/10 dark:bg-destructive/15' 
                : getTimeInfo.isUrgent 
                  ? 'bg-warning/10 dark:bg-warning/15' 
                  : 'bg-muted'
            }`}>
              <Clock className={`w-4 h-4 flex-shrink-0 ${
                getTimeInfo.isExpired 
                  ? 'text-destructive' 
                  : getTimeInfo.isUrgent 
                    ? 'text-warning' 
                    : 'text-primary'
              }`} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted">Status</p>
                <p className={`text-xs font-medium truncate ${
                  getTimeInfo.isExpired 
                    ? 'text-destructive' 
                    : getTimeInfo.isUrgent 
                      ? 'text-warning' 
                      : 'text-foreground'
                }`}>
                  {getTimeInfo.text}
                </p>
              </div>
            </div>

            {/* Privacy */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted">Privacy</p>
                <p className="text-xs font-medium text-foreground capitalize truncate">
                  {poll.anonymityMode}
                </p>
              </div>
            </div>

            {/* Recipients */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted">
              <Users className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-foreground-muted">Recipients</p>
                <p className="text-xs font-medium text-foreground truncate">
                  {poll.consumers.length} people
                </p>
              </div>
            </div>
          </div>

          {/* Labels */}
          {poll.labels && poll.labels.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-foreground-muted" />
              <LabelPill labels={poll.labels} size="sm" />
            </div>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-background-secondary">
          
          {/* Expired Warning */}
          {isExpired && !userResponse && (
            <div className="mb-6 p-4 bg-destructive/10 dark:bg-destructive/15 border border-destructive/30 rounded-xl">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    This signal has expired
                  </p>
                  <p className="text-sm text-destructive/80 mt-1">
                    The deadline has passed and responses are no longer accepted.
                    {poll.defaultResponse && (
                      <span> Your response was recorded as: <strong>"{poll.defaultResponse}"</strong></span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Response Options */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground-secondary mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {canRespond ? 'Select your response' : 'Response options'}
            </p>
            <div className="space-y-2">
              {poll.options.map((option, index) => {
                const isSelected = userResponse 
                  ? userResponse.response === option.text 
                  : selectedValue === option.text;
                const isDisabled = !canRespond;

                return (
                  <label
                    key={option.id || index}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl transition-all duration-200 border
                      ${isSelected
                        ? 'bg-ribbit-deep-teal/10 dark:bg-ribbit-deep-teal/20 border-ribbit-deep-teal dark:border-ribbit-muted-teal shadow-sm'
                        : 'bg-white dark:bg-ribbit-slate-grey/40 border-ribbit-deep-teal/10 dark:border-ribbit-muted-teal/10'
                      }
                      ${canRespond 
                        ? 'cursor-pointer hover:border-ribbit-deep-teal/50 dark:hover:border-ribbit-muted-teal/50 hover:shadow-sm' 
                        : 'cursor-default'
                      }
                      ${isDisabled && !isSelected ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Radio Circle */}
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                      ${isSelected
                        ? 'border-ribbit-deep-teal dark:border-ribbit-muted-teal bg-ribbit-deep-teal dark:bg-ribbit-muted-teal'
                        : 'border-ribbit-deep-teal/30 dark:border-ribbit-muted-teal/30'
                      }
                    `}>
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white dark:text-ribbit-charcoal" />
                      )}
                    </div>

                    {canRespond && (
                      <input
                        type="radio"
                        name="poll-response"
                        value={option.text}
                        checked={selectedValue === option.text}
                        onChange={(e) => setSelectedValue(e.target.value)}
                        className="hidden"
                      />
                    )}

                    <span className={`
                      flex-1 transition-colors
                      ${isSelected
                        ? 'text-ribbit-slate-grey dark:text-ribbit-muted-teal font-medium'
                        : 'text-ribbit-charcoal dark:text-ribbit-ash-grey'
                      }
                    `}>
                      <LabelText text={option.text} labels={labels} />
                    </span>

                    {/* Option index badge */}
                    <span className="text-xs text-ribbit-charcoal/30 dark:text-ribbit-ash-grey/30 font-mono">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* User Response Details (if already responded) */}
          {userResponse && (
            <div className={`mb-6 p-4 rounded-xl border ${
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
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-ribbit-charcoal dark:text-ribbit-ash-grey">
                      <span className="opacity-60">Response:</span>{' '}
                      <span className="font-medium"><LabelText text={userResponse.response} labels={labels} /></span>
                    </p>
                    {userResponse.skipReason && (
                      <p className="text-ribbit-charcoal dark:text-ribbit-ash-grey">
                        <span className="opacity-60">Reason:</span> {userResponse.skipReason}
                      </p>
                    )}
                    <p className="text-ribbit-charcoal/60 dark:text-ribbit-ash-grey/60 text-xs">
                      {formatDateTime(userResponse.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Default Response Info (only if can respond) */}
          {canRespond && poll.showDefaultToConsumers && poll.defaultResponse && (
            <div className="mb-6 p-4 bg-ribbit-muted-teal/20 dark:bg-ribbit-slate-grey/30 border border-ribbit-deep-teal/20 dark:border-ribbit-muted-teal/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-ribbit-deep-teal dark:text-ribbit-muted-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ribbit-slate-grey dark:text-ribbit-muted-teal">
                    Default response if you don't respond:
                  </p>
                  <p className="text-sm text-ribbit-charcoal dark:text-ribbit-ash-grey mt-1 font-medium">
                    "{poll.defaultResponse}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Alert Warning (only if can respond) */}
          {canRespond && poll.isPersistentFinalAlert && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Mandatory final alert enabled
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    You'll receive a persistent alert 1 minute before deadline.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-ribbit-deep-teal/10 dark:border-ribbit-muted-teal/10 bg-ribbit-ash-lighter dark:bg-ribbit-ocean-deep">
          {userResponse ? (
            <div className="flex items-center justify-center gap-2 py-2 text-ribbit-deep-teal dark:text-ribbit-muted-teal">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Response recorded</span>
            </div>
          ) : isExpired ? (
            <div className="flex items-center justify-center gap-2 py-2 text-red-500">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Responses closed</span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!selectedValue}
              className="
                w-full flex items-center justify-center gap-2 px-6 py-3.5
                bg-ribbit-slate-grey hover:bg-ribbit-charcoal text-ribbit-ash-grey
                dark:bg-ribbit-muted-teal dark:hover:bg-ribbit-teal-light dark:text-ribbit-charcoal
                rounded-xl font-semibold
                shadow-lg hover:shadow-xl
                transition-all duration-200
                hover:scale-[1.01] active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
              "
            >
              <Send className="w-5 h-5" />
              Submit Response
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-ribbit-ash-grey dark:bg-ribbit-charcoal rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-ribbit-deep-teal/20 dark:border-ribbit-muted-teal/20 scale-bounce">
            {/* Modal Header */}
            <div className="p-6 text-center border-b border-ribbit-deep-teal/10 dark:border-ribbit-muted-teal/10">
              <div className="w-16 h-16 bg-ribbit-deep-teal/10 dark:bg-ribbit-muted-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-ribbit-deep-teal dark:text-ribbit-muted-teal" />
              </div>
              <h3 className="text-xl font-semibold text-ribbit-slate-grey dark:text-ribbit-muted-teal mb-2">
                Confirm Response
              </h3>
              <p className="text-ribbit-charcoal/60 dark:text-ribbit-ash-grey/60 text-sm">
                Please review your selection before submitting
              </p>
            </div>

            {/* Selected Response */}
            <div className="p-6 bg-ribbit-muted-teal/15 dark:bg-ribbit-slate-grey/20">
              <p className="text-xs uppercase tracking-wider text-ribbit-charcoal/50 dark:text-ribbit-ash-grey/50 mb-2">
                Your response
              </p>
              <div className="p-4 bg-white dark:bg-ribbit-slate-grey/40 rounded-xl border border-ribbit-deep-teal/20 dark:border-ribbit-muted-teal/20">
                <p className="text-ribbit-slate-grey dark:text-ribbit-muted-teal font-medium text-lg">
                  <LabelText text={selectedValue} labels={labels} />
                </p>
              </div>
              <p className="text-xs text-ribbit-charcoal/40 dark:text-ribbit-ash-grey/40 mt-3 text-center">
                This action cannot be undone
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 flex gap-3 border-t border-ribbit-deep-teal/10 dark:border-ribbit-muted-teal/10">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 bg-ribbit-ash-lighter dark:bg-ribbit-slate-grey/30 text-ribbit-charcoal dark:text-ribbit-ash-grey rounded-xl hover:bg-ribbit-muted-teal/30 dark:hover:bg-ribbit-slate-grey/50 transition-all font-medium active:scale-[0.98]"
              >
                Go Back
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-ribbit-slate-grey dark:bg-ribbit-muted-teal hover:bg-ribbit-charcoal dark:hover:bg-ribbit-teal-light text-ribbit-ash-grey dark:text-ribbit-charcoal rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
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
