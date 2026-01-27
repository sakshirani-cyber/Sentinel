import { useState, useMemo } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Poll, Response } from '../../types';
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
  
  // Loading state for analytics
  loadingAnalytics?: boolean;
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
  loadingAnalytics = false,
}: SignalRowProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Delete confirmation handlers
  const handleDeleteClick = () => {
    console.log('[SignalRow] Delete button clicked for poll:', poll.id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    console.log('[SignalRow] Confirming delete for poll:', poll.id);
    try {
      await onDelete?.(poll.id);
      console.log('[SignalRow] Delete completed for poll:', poll.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('[SignalRow] Delete cancelled for poll:', poll.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`
        group relative
        bg-card/60 dark:bg-card/80
        backdrop-blur-sm
        border rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        card-interactive-accent
        ${isUrgent && !isCompleted && !hasResponded
          ? 'border-destructive/30 dark:border-destructive/50 bg-destructive/5 dark:bg-destructive/10'
          : 'border-border'
        }
      `}
    >
      {/* Urgent indicator bar */}
      {isUrgent && !isCompleted && !hasResponded && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse" />
      )}

      <div className="p-4">
        {/* Inline Delete Confirmation - Appears at top of card */}
        {showDeleteConfirm && (
          <div 
            className="
              mb-4 p-4 rounded-xl
              bg-card-solid dark:bg-card-solid
              border border-destructive/30 dark:border-destructive/40
              shadow-lg
              animate-fade-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground dark:text-foreground">
                  Are you sure?
                </h3>
                <p className="text-xs text-foreground-muted dark:text-foreground-muted">
                  This is a permanent action
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-sm text-foreground-muted dark:text-foreground-muted mb-4 bg-secondary dark:bg-muted p-3 rounded-lg border border-border">
              Deleting this signal will permanently remove it from both local and cloud storage. All responses will be deleted. This action cannot be undone.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-2
                  bg-muted dark:bg-secondary
                  text-foreground dark:text-foreground
                  rounded-lg font-medium text-sm
                  hover:bg-muted/80 dark:hover:bg-secondary/80
                  transition-colors
                  disabled:opacity-50
                "
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-2
                  bg-destructive hover:bg-destructive/90
                  text-destructive-foreground
                  rounded-lg font-medium text-sm
                  transition-colors
                  flex items-center justify-center gap-2
                  disabled:opacity-50
                "
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Main Row: Header with Action Buttons */}
        <div className="flex items-start gap-3">
          {/* Main Content: Header */}
          <div className="flex-1 min-w-0">
            <SignalRowHeader
              poll={poll}
              userResponse={userResponse}
              hasDraft={hasDraft}
              isExpanded={isExpanded}
              onToggleExpand={toggleExpand}
              onAnalytics={onAnalytics}
              onEdit={onEdit}
              onDeleteClick={onDelete ? handleDeleteClick : undefined}
              isCreator={isCreator}
              isCompleted={isCompleted}
              viewMode={viewMode}
              loadingAnalytics={loadingAnalytics}
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
