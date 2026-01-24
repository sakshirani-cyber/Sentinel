import { useState } from 'react';
import { BarChart3, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Poll } from '../../types';

interface SignalRowActionsProps {
  poll: Poll;
  isCreator: boolean;
  isCompleted: boolean;
  viewMode: 'inbox' | 'sent';
  onAnalytics?: (poll: Poll) => void;
  onEdit?: (poll: Poll) => void;
  onDelete?: (pollId: string) => void;
  loadingAnalytics?: boolean;
}

/**
 * SignalRowActions Component
 * 
 * Action buttons displayed on the left side of signal rows:
 * - Analytics: Visible to all users
 * - Edit: Only for creator, non-completed signals
 * - Delete: Only for creator, non-completed signals (direct button, no dropdown)
 */
export default function SignalRowActions({
  poll,
  isCreator,
  isCompleted,
  viewMode,
  onAnalytics,
  onEdit,
  onDelete,
  loadingAnalytics = false,
}: SignalRowActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    console.log('[SignalRowActions] Delete button clicked for poll:', poll.id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    console.log('[SignalRowActions] Confirming delete for poll:', poll.id);
    try {
      await onDelete?.(poll.id);
      console.log('[SignalRowActions] Delete completed for poll:', poll.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[SignalRowActions] Delete cancelled for poll:', poll.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
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
              : 'text-foreground-muted hover:text-foreground hover:bg-muted active:scale-95'
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
          "
          title="Edit Signal"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      {/* Delete Button - Only for creator, non-completed (direct button, no dropdown) */}
      {showPublisherActions && onDelete && (
        <button
          onClick={handleDeleteClick}
          className="
            p-2 rounded-lg
            text-foreground-muted
            hover:text-destructive
            hover:bg-destructive/10
            transition-all duration-200
            active:scale-95
          "
          title="Delete Signal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Delete Confirmation Dialog - Opaque background */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <div 
            className="
              bg-card-solid dark:bg-card-solid
              rounded-xl shadow-2xl
              p-6 max-w-sm w-full mx-4
              border border-border dark:border-border
              animate-scale-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                  Are you sure?
                </h3>
                <p className="text-sm text-foreground-muted dark:text-foreground-muted">
                  This is a permanent action
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground-muted dark:text-foreground-muted mb-6 bg-secondary dark:bg-muted p-3 rounded-lg border border-border">
              Deleting this signal will permanently remove it from both local and cloud storage. All responses will be deleted. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-2.5
                  bg-muted dark:bg-secondary
                  text-foreground dark:text-foreground
                  rounded-lg font-medium
                  hover:bg-muted/80 dark:hover:bg-secondary/80
                  transition-colors
                  disabled:opacity-50
                "
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-2.5
                  bg-destructive hover:bg-destructive/90
                  text-destructive-foreground
                  rounded-lg font-medium
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
        </div>
      )}
    </div>
  );
}
