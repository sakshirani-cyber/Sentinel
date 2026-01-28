import { useState, useEffect, useMemo } from 'react';
import { Clock, User, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Poll, Response } from '../../types';
import SignalIndicators from './SignalIndicators';
import StatusBadge, { getSignalStatus } from './StatusBadge';
import LabelPill from '../LabelPill';

interface SignalListItemProps {
  poll: Poll;
  hasDraft?: boolean;
  isCompleted?: boolean;
  userResponse?: Response;
  onClick?: () => void;
  showPublisher?: boolean;
  showTimeRemaining?: boolean;
}

/**
 * SignalListItem Component
 * 
 * A modern, glassmorphism-styled signal card with:
 * - Earthy forest color palette
 * - Smooth hover transitions and micro-interactions
 * - Status indicators and badges
 * - Time remaining display
 */
export default function SignalListItem({
  poll,
  hasDraft,
  isCompleted,
  userResponse,
  onClick,
  showPublisher = true,
  showTimeRemaining = true,
}: SignalListItemProps) {
  const [labels, setLabels] = useState<{ id: string; name: string; color: string }[]>([]);

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const timeRemaining = useMemo(() => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return { text: 'Expired', isUrgent: true, isExpired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isUrgent = diff < 1000 * 60 * 60; // Less than 1 hour

    if (days > 0) return { text: `${days}d ${hours}h left`, isUrgent: false, isExpired: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m left`, isUrgent, isExpired: false };
    return { text: `${minutes}m left`, isUrgent: true, isExpired: false };
  }, [poll.deadline]);

  const status = getSignalStatus({
    status: poll.status,
    deadline: poll.deadline,
    hasResponse: !!userResponse,
  });

  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        group relative
        bg-card/60 dark:bg-card/80
        backdrop-blur-sm
        border rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${isClickable ? 'cursor-pointer card-interactive-accent' : 'cursor-default'}
        ${isClickable ? 'hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5' : ''}
        ${timeRemaining.isUrgent && !isCompleted
          ? 'border-destructive/30 dark:border-destructive/50 bg-destructive/5 dark:bg-destructive/10'
          : 'border-border'
        }
        ${isClickable ? 'active:scale-[0.99]' : ''}
      `}
    >
      {/* Urgent indicator bar */}
      {timeRemaining.isUrgent && !isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse" />
      )}

      <div className="p-5">
        {/* Top Row: Publisher & Time */}
        <div className="flex items-start justify-between mb-3">
          {showPublisher && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-ribbit-hunter-green/20 dark:bg-ribbit-dry-sage/20 flex items-center justify-center">
                <User className="w-4 h-4 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
              </div>
              <div>
                <p className="text-base font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                  {poll.publisherName}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTime(poll.deadline)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Time Remaining / Status Badge */}
          <div className="flex items-center gap-2">
            {showTimeRemaining && !isCompleted && (
              <span
                className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  transition-colors duration-200
                  ${timeRemaining.isUrgent
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                    : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-fern/30 text-ribbit-hunter-green dark:text-ribbit-dry-sage'
                  }
                `}
              >
                {timeRemaining.text}
              </span>
            )}
            {isCompleted && <StatusBadge status={status} />}
          </div>
        </div>

        {/* Question / Title */}
        <h3 className="text-base font-semibold text-ribbit-hunter-green dark:text-ribbit-dust-grey mb-3 leading-snug group-hover:text-ribbit-pine-teal dark:group-hover:text-ribbit-dry-sage transition-colors">
          {poll.question}
        </h3>

        {/* Indicators Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Signal Type Badge */}
          <span className="px-2 py-0.5 rounded text-sm font-medium bg-ribbit-hunter-green/10 dark:bg-ribbit-fern/20 text-ribbit-hunter-green dark:text-ribbit-dry-sage border border-ribbit-hunter-green/20 dark:border-ribbit-fern/30">
            Poll
          </span>

          {/* Status Indicators */}
          <SignalIndicators
            isPersistent={poll.isPersistentFinalAlert && !isCompleted}
            isAnonymous={poll.anonymityMode === 'anonymous'}
            isEdited={poll.isEdited}
            isScheduled={poll.status === 'scheduled'}
            isUrgent={timeRemaining.isUrgent && !isCompleted}
            showLabels={false}
          />

          {/* Draft Indicator */}
          {hasDraft && !isCompleted && (
            <span className="px-2 py-0.5 rounded text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Draft saved
            </span>
          )}

          {/* Default Response Indicator */}
          {poll.showDefaultToConsumers && !isCompleted && poll.defaultResponse && (
            <span className="px-2 py-0.5 rounded text-sm bg-ribbit-dust-grey/60 dark:bg-ribbit-pine-teal/40 text-ribbit-pine-teal dark:text-ribbit-dust-grey border border-ribbit-fern/20">
              Default: {poll.defaultResponse.slice(0, 20)}
              {poll.defaultResponse.length > 20 ? '...' : ''}
            </span>
          )}
        </div>

        {/* Labels */}
        {poll.labels && poll.labels.length > 0 && (
          <div className="mb-3">
            <LabelPill labels={poll.labels} />
          </div>
        )}

        {/* Response Display (Completed) */}
        {isCompleted && userResponse && (
          <div
            className={`
              p-3 rounded-lg border
              ${userResponse.isDefault
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : userResponse.skipReason
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 border-ribbit-fern/30'
              }
            `}
          >
            <div className="flex items-start gap-2">
              {userResponse.isDefault ? (
                <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              ) : userResponse.skipReason ? (
                <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-ribbit-hunter-green dark:text-ribbit-dry-sage flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-base font-medium mb-0.5 ${
                    userResponse.isDefault
                      ? 'text-red-700 dark:text-red-300'
                      : userResponse.skipReason
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-ribbit-hunter-green dark:text-ribbit-dry-sage'
                  }`}
                >
                  {userResponse.isDefault
                    ? 'Default response taken'
                    : userResponse.skipReason
                      ? 'Skipped'
                      : 'Your Response'}
                </p>
                <p
                  className={`text-base truncate ${
                    userResponse.isDefault
                      ? 'text-red-600 dark:text-red-400'
                      : userResponse.skipReason
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-ribbit-pine-teal dark:text-ribbit-dust-grey'
                  }`}
                >
                  {userResponse.response}
                </p>
                {userResponse.skipReason && (
                  <p className="text-sm text-amber-500 dark:text-amber-400 mt-1 italic">
                    Reason: "{userResponse.skipReason}"
                  </p>
                )}
                <p className="text-sm text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 mt-1">
                  {formatDateTime(userResponse.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Click Indicator */}
        {isClickable && !isCompleted && (
          <div className="flex items-center justify-end mt-3 text-base text-ribbit-fern dark:text-ribbit-dry-sage group-hover:translate-x-1 transition-transform duration-200">
            <span className="mr-1">Respond</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
