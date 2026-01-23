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
    <div className={`fixed inset-0 ${isPersistentContext ? 'bg-ribbit-pine-teal' : 'bg-black/60 backdrop-blur-sm'} flex items-center justify-center p-4 z-50 animate-fade-in`}>
      <div className="bg-white dark:bg-ribbit-pine-teal rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-ribbit-fern/10 dark:border-ribbit-dry-sage/20 animate-scale-in">
        
        {/* Status Bar */}
        <div className={`
          px-4 py-2 text-center text-sm font-medium
          ${status.color === 'green' ? 'bg-emerald-500 text-white' : ''}
          ${status.color === 'red' ? 'bg-red-500 text-white' : ''}
          ${status.color === 'amber' ? 'bg-amber-500 text-white' : ''}
          ${status.color === 'blue' ? 'bg-ribbit-fern text-white' : ''}
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
        <div className="flex-shrink-0 p-6 border-b border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
          {/* Close Button - Top Right */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center">
                <User className="w-5 h-5 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
              </div>
              <div>
                <p className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">From</p>
                <p className="font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">{poll.publisherName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 hover:text-ribbit-hunter-green dark:hover:text-ribbit-dry-sage hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-hunter-green/30 rounded-lg transition-all"
              aria-label="Close"
            >
              {isPersistentContext ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>

          {/* Question */}
          <h2 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage leading-relaxed mb-4">
            <LabelText text={poll.question} labels={labels} />
          </h2>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Deadline */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30">
              <Calendar className="w-4 h-4 text-ribbit-fern dark:text-ribbit-dry-sage flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">Deadline</p>
                <p className="text-xs font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey truncate">
                  {new Date(poll.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Time Remaining */}
            <div className={`flex items-center gap-2 p-2.5 rounded-lg ${
              getTimeInfo.isExpired 
                ? 'bg-red-50 dark:bg-red-900/20' 
                : getTimeInfo.isUrgent 
                  ? 'bg-amber-50 dark:bg-amber-900/20' 
                  : 'bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30'
            }`}>
              <Clock className={`w-4 h-4 flex-shrink-0 ${
                getTimeInfo.isExpired 
                  ? 'text-red-500' 
                  : getTimeInfo.isUrgent 
                    ? 'text-amber-500' 
                    : 'text-ribbit-fern dark:text-ribbit-dry-sage'
              }`} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">Status</p>
                <p className={`text-xs font-medium truncate ${
                  getTimeInfo.isExpired 
                    ? 'text-red-600 dark:text-red-400' 
                    : getTimeInfo.isUrgent 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-ribbit-pine-teal dark:text-ribbit-dust-grey'
                }`}>
                  {getTimeInfo.text}
                </p>
              </div>
            </div>

            {/* Privacy */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30">
              <Shield className="w-4 h-4 text-ribbit-fern dark:text-ribbit-dry-sage flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">Privacy</p>
                <p className="text-xs font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey capitalize truncate">
                  {poll.anonymityMode}
                </p>
              </div>
            </div>

            {/* Recipients */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30">
              <Users className="w-4 h-4 text-ribbit-fern dark:text-ribbit-dry-sage flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">Recipients</p>
                <p className="text-xs font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey truncate">
                  {poll.consumers.length} people
                </p>
              </div>
            </div>
          </div>

          {/* Labels */}
          {poll.labels && poll.labels.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40" />
              <LabelPill labels={poll.labels} size="sm" />
            </div>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-ribbit-dust-grey/30 dark:bg-ribbit-hunter-green/20">
          
          {/* Expired Warning */}
          {isExpired && !userResponse && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    This signal has expired
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
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
            <p className="text-sm font-medium text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 mb-3 flex items-center gap-2">
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
                        ? 'bg-ribbit-fern/10 dark:bg-ribbit-fern/20 border-ribbit-fern dark:border-ribbit-dry-sage shadow-sm'
                        : 'bg-white dark:bg-ribbit-hunter-green/40 border-ribbit-fern/10 dark:border-ribbit-dry-sage/10'
                      }
                      ${canRespond 
                        ? 'cursor-pointer hover:border-ribbit-fern/50 dark:hover:border-ribbit-dry-sage/50 hover:shadow-sm' 
                        : 'cursor-default'
                      }
                      ${isDisabled && !isSelected ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Radio Circle */}
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                      ${isSelected
                        ? 'border-ribbit-fern dark:border-ribbit-dry-sage bg-ribbit-fern dark:bg-ribbit-dry-sage'
                        : 'border-ribbit-fern/30 dark:border-ribbit-dry-sage/30'
                      }
                    `}>
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white dark:text-ribbit-pine-teal" />
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
                        ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage font-medium'
                        : 'text-ribbit-pine-teal dark:text-ribbit-dust-grey'
                      }
                    `}>
                      <LabelText text={option.text} labels={labels} />
                    </span>

                    {/* Option index badge */}
                    <span className="text-xs text-ribbit-pine-teal/30 dark:text-ribbit-dust-grey/30 font-mono">
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
                    <p className="text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                      <span className="opacity-60">Response:</span>{' '}
                      <span className="font-medium"><LabelText text={userResponse.response} labels={labels} /></span>
                    </p>
                    {userResponse.skipReason && (
                      <p className="text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                        <span className="opacity-60">Reason:</span> {userResponse.skipReason}
                      </p>
                    )}
                    <p className="text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 text-xs">
                      {formatDateTime(userResponse.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Default Response Info (only if can respond) */}
          {canRespond && poll.showDefaultToConsumers && poll.defaultResponse && (
            <div className="mb-6 p-4 bg-ribbit-dry-sage/20 dark:bg-ribbit-hunter-green/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-ribbit-fern dark:text-ribbit-dry-sage flex-shrink-0 mt-0.5" />
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
        <div className="flex-shrink-0 p-4 border-t border-ribbit-fern/10 dark:border-ribbit-dry-sage/10 bg-white dark:bg-ribbit-pine-teal">
          {userResponse ? (
            <div className="flex items-center justify-center gap-2 py-2 text-ribbit-fern dark:text-ribbit-dry-sage">
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
                bg-ribbit-hunter-green hover:bg-[#2f4a35] text-white
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
          <div className="bg-white dark:bg-ribbit-pine-teal rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 text-center border-b border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
              <div className="w-16 h-16 bg-ribbit-fern/10 dark:bg-ribbit-dry-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-ribbit-fern dark:text-ribbit-dry-sage" />
              </div>
              <h3 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
                Confirm Response
              </h3>
              <p className="text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 text-sm">
                Please review your selection before submitting
              </p>
            </div>

            {/* Selected Response */}
            <div className="p-6 bg-ribbit-dust-grey/30 dark:bg-ribbit-hunter-green/20">
              <p className="text-xs uppercase tracking-wider text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 mb-2">
                Your response
              </p>
              <div className="p-4 bg-white dark:bg-ribbit-hunter-green/40 rounded-xl border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20">
                <p className="text-ribbit-hunter-green dark:text-ribbit-dry-sage font-medium text-lg">
                  <LabelText text={selectedValue} labels={labels} />
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
                className="flex-1 px-4 py-3 bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30 text-ribbit-pine-teal dark:text-ribbit-dust-grey rounded-xl hover:bg-ribbit-dry-sage/50 dark:hover:bg-ribbit-hunter-green/50 transition-colors font-medium"
              >
                Go Back
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-ribbit-hunter-green hover:bg-[#2f4a35] text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
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
