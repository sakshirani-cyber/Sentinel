import { useMemo } from 'react';
import { Info, Clock, User, BarChart3, Edit, Trash2, Loader2 } from 'lucide-react';
import { Poll, Response } from '../../types';
import SignalIndicators from './SignalIndicators';
import LabelPill from '../LabelPill';

interface SignalRowHeaderProps {
  poll: Poll;
  userResponse?: Response;
  hasDraft?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  // Action button props
  onAnalytics?: (poll: Poll) => void;
  onEdit?: (poll: Poll) => void;
  onDeleteClick?: () => void;
  isCreator?: boolean;
  isCompleted?: boolean;
  viewMode?: 'inbox' | 'sent';
  loadingAnalytics?: boolean;
}

/**
 * SignalRowHeader Component
 * 
 * The collapsed state of a signal row showing:
 * - Signal Type badge
 * - Title
 * - Deadline + Time Remaining
 * - Publisher Details (name, email)
 * - Status indicators (persistent, anonymous, edited)
 * - Labels
 * - Action buttons (More Details, Analytics, Edit, Delete)
 */
export default function SignalRowHeader({
  poll,
  userResponse,
  hasDraft,
  isExpanded,
  onToggleExpand,
  onAnalytics,
  onEdit,
  onDeleteClick,
  isCreator = false,
  isCompleted = false,
  viewMode = 'inbox',
  loadingAnalytics = false,
}: SignalRowHeaderProps) {
  // Calculate time remaining
  const timeInfo = useMemo(() => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) {
      const expiredAgo = Math.abs(diff);
      const days = Math.floor(expiredAgo / (1000 * 60 * 60 * 24));
      const hours = Math.floor((expiredAgo % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return { text: `Expired ${days}d ago`, isExpired: true, isUrgent: false };
      if (hours > 0) return { text: `Expired ${hours}h ago`, isExpired: true, isUrgent: false };
      return { text: 'Expired', isExpired: true, isUrgent: false };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isUrgent = diff < 1000 * 60 * 60; // Less than 1 hour

    if (days > 0) return { text: `${days}d ${hours}h left`, isExpired: false, isUrgent: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m left`, isExpired: false, isUrgent };
    return { text: `${minutes}m left`, isExpired: false, isUrgent: true };
  }, [poll.deadline]);

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompletedStatus = poll.status === 'completed' || timeInfo.isExpired;
  const hasResponded = !!userResponse;
  
  // Only show publisher actions in 'sent' view mode for creator
  const showPublisherActions = isCreator && viewMode === 'sent' && !isCompleted;

  const handleAnalyticsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAnalytics?.(poll);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(poll);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[SignalRowHeader] Delete button clicked for poll:', poll.id);
    onDeleteClick?.();
  };

  const handleMoreDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  return (
    <div 
      className="flex items-start gap-3"
    >
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Top Row: Type Badge + Title + Time */}
        <div className="flex items-start gap-3 mb-2">
          {/* Signal Type Badge */}
          <span className="
            flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium
            bg-ribbit-hunter-green/10 dark:bg-ribbit-fern/20 
            text-ribbit-hunter-green dark:text-ribbit-dry-sage 
            border border-ribbit-hunter-green/20 dark:border-ribbit-fern/30
          ">
            Poll
          </span>

          {/* Title */}
          <h3 className="
            flex-1 min-w-0
            text-base font-semibold leading-snug
            text-ribbit-hunter-green dark:text-ribbit-dust-grey
            group-hover:text-ribbit-pine-teal dark:group-hover:text-ribbit-dry-sage
            transition-colors
            line-clamp-2
          ">
            {poll.question}
          </h3>

          {/* Deadline + Time Remaining */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 mb-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatDeadline(poll.deadline)}</span>
            </div>
            <span className={`
              text-xs font-medium px-2 py-0.5 rounded-full
              ${timeInfo.isExpired
                ? 'bg-ribbit-pine-teal/10 dark:bg-ribbit-dust-grey/10 text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60'
                : timeInfo.isUrgent
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  : 'bg-ribbit-dry-sage/50 dark:bg-ribbit-fern/30 text-ribbit-hunter-green dark:text-ribbit-dry-sage'
              }
            `}>
              {hasResponded ? 'Responded' : timeInfo.text}
            </span>
          </div>
        </div>

        {/* Second Row: Publisher Details */}
        <div className="flex items-center gap-2 mb-2 text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          <User className="w-3.5 h-3.5" />
          <span className="font-medium">{poll.publisherName}</span>
          <span className="text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40">•</span>
          <span className="truncate">{poll.publisherEmail}</span>
        </div>

        {/* Third Row: Indicators + Labels + Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left Side: Indicators + Labels */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Indicators */}
            <SignalIndicators
              isPersistent={poll.isPersistentFinalAlert && !isCompletedStatus}
              isAnonymous={poll.anonymityMode === 'anonymous'}
              isEdited={poll.isEdited}
              isScheduled={poll.status === 'scheduled'}
              isUrgent={timeInfo.isUrgent && !isCompletedStatus && !hasResponded}
              showLabels={true}
              size="sm"
            />

            {/* Draft Indicator */}
            {hasDraft && !isCompletedStatus && !hasResponded && (
              <span className="
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                bg-amber-100 dark:bg-amber-900/30 
                text-amber-700 dark:text-amber-400 
                border border-amber-200 dark:border-amber-800
              ">
                Draft saved
              </span>
            )}

            {/* Labels */}
            {poll.labels && poll.labels.length > 0 && (
              <LabelPill labels={poll.labels} size="sm" />
            )}
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* More Details Button - Always visible */}
            <button
              onClick={handleMoreDetailsClick}
              className="
                p-2 rounded-lg
                text-foreground-muted
                hover:text-foreground
                hover:bg-muted
                transition-all duration-200
                active:scale-95
                dark:text-foreground-muted
                dark:hover:text-foreground
                dark:hover:bg-muted
              "
              title={isExpanded ? "Hide Details" : "More Details"}
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Analytics Button - Always visible */}
            {onAnalytics && (
              <button
                onClick={handleAnalyticsClick}
                disabled={loadingAnalytics}
                className={`
                  p-2 rounded-lg
                  transition-all duration-200
                  ${loadingAnalytics 
                    ? 'text-primary cursor-wait' 
                    : 'text-foreground-muted hover:text-foreground hover:bg-muted active:scale-95 dark:text-foreground-muted dark:hover:text-foreground dark:hover:bg-muted'
                  }
                `}
                title={loadingAnalytics ? "Loading Analytics..." : "View Analytics"}
              >
                {loadingAnalytics ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Edit Button - Only for creator, non-completed */}
            {showPublisherActions && onEdit && (
              <button
                onClick={handleEditClick}
                className="
                  p-2 rounded-lg
                  text-foreground-muted
                  hover:text-foreground
                  hover:bg-muted
                  transition-all duration-200
                  active:scale-95
                  dark:text-foreground-muted
                  dark:hover:text-foreground
                  dark:hover:bg-muted
                "
                title="Edit Signal"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {/* Delete Button - Only for creator, non-completed */}
            {showPublisherActions && onDeleteClick && (
              <button
                onClick={handleDeleteClick}
                className="
                  p-2 rounded-lg
                  text-foreground-muted
                  hover:text-destructive
                  hover:bg-destructive/10
                  transition-all duration-200
                  active:scale-95
                  dark:text-foreground-muted
                  dark:hover:text-destructive
                  dark:hover:bg-destructive/10
                "
                title="Delete Signal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
