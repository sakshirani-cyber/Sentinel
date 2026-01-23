import { useState, useMemo } from 'react';
import { Poll, Response } from '../../types';
import SignalRowActions from './SignalRowActions';
import SignalRowHeader from './SignalRowHeader';
import SignalRowExpanded from './SignalRowExpanded';

interface SignalRowProps {
  poll: Poll;
  userResponse?: Response;
  hasDraft?: boolean;
  draft?: string;
  
  // Context
  viewMode: 'inbox' | 'sent';
  currentUserEmail: string;
  isPublisher: boolean;
  
  // Callbacks
  onSubmitResponse?: (pollId: string, value: string) => Promise<void>;
  onSaveDraft?: (pollId: string, value: string) => void;
  onEdit?: (poll: Poll) => void;
  onDelete?: (pollId: string) => void;
  onAnalytics?: (poll: Poll) => void;

  // Optional: Start expanded
  defaultExpanded?: boolean;
}

/**
 * SignalRow Component
 * 
 * A thin horizontal expandable row for displaying signals.
 * Replaces the previous card and modal-based approach.
 * 
 * Features:
 * - Collapsed state shows key info (type, title, deadline, publisher, indicators)
 * - Expanded state shows full details and response form inline
 * - Context-aware actions (analytics for all, edit/delete for publisher)
 * - Eligibility-based response form display
 */
export default function SignalRow({
  poll,
  userResponse,
  hasDraft,
  draft,
  viewMode,
  currentUserEmail,
  isPublisher,
  onSubmitResponse,
  onSaveDraft,
  onEdit,
  onDelete,
  onAnalytics,
  defaultExpanded = false,
}: SignalRowProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Determine if current user is the creator of this signal
  const isCreator = poll.publisherEmail.toLowerCase() === currentUserEmail.toLowerCase();

  // Check if signal is completed/expired
  const isCompleted = useMemo(() => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    return poll.status === 'completed' || deadline < now;
  }, [poll.deadline, poll.status]);

  // Check if signal is urgent (less than 1 hour remaining)
  const isUrgent = useMemo(() => {
    if (isCompleted) return false;
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff < 1000 * 60 * 60; // Less than 1 hour
  }, [poll.deadline, isCompleted]);

  const hasResponded = !!userResponse;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`
        group relative
        bg-ribbit-dry-sage/40 dark:bg-ribbit-hunter-green/40
        backdrop-blur-sm
        border rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${isUrgent && !isCompleted && !hasResponded
          ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10'
          : 'border-ribbit-fern/20 dark:border-ribbit-dry-sage/15'
        }
        hover:shadow-md hover:border-ribbit-fern/40 dark:hover:border-ribbit-dry-sage/30
      `}
    >
      {/* Urgent indicator bar */}
      {isUrgent && !isCompleted && !hasResponded && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse" />
      )}

      <div className="p-4">
        {/* Main Row: Actions + Header */}
        <div className="flex items-start gap-3">
          {/* Left Side: Action Buttons */}
          <SignalRowActions
            poll={poll}
            isCreator={isCreator}
            isCompleted={isCompleted}
            viewMode={viewMode}
            onAnalytics={onAnalytics}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          {/* Separator */}
          {(onAnalytics || (isCreator && viewMode === 'sent' && !isCompleted)) && (
            <div className="w-px h-16 bg-ribbit-fern/10 dark:bg-ribbit-dry-sage/10 flex-shrink-0" />
          )}

          {/* Main Content: Header */}
          <div className="flex-1 min-w-0">
            <SignalRowHeader
              poll={poll}
              userResponse={userResponse}
              hasDraft={hasDraft}
              isExpanded={isExpanded}
              onToggleExpand={toggleExpand}
            />
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="animate-fade-in">
            <SignalRowExpanded
              poll={poll}
              userResponse={userResponse}
              draft={draft}
              currentUserEmail={currentUserEmail}
              onSubmitResponse={onSubmitResponse}
              onSaveDraft={onSaveDraft}
            />
          </div>
        )}
      </div>
    </div>
  );
}
