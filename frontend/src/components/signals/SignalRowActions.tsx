import { useState } from 'react';
import { BarChart3, Edit, MoreVertical, Trash2, Loader2 } from 'lucide-react';
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
 * - More (Delete): Only for creator, non-completed signals
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(!showMoreMenu);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(poll.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  // Close more menu when clicking outside
  const handleBlur = () => {
    setTimeout(() => setShowMoreMenu(false), 150);
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

      {/* More Options Button - Only for creator, non-completed */}
      {showPublisherActions && onDelete && (
        <div className="relative" onBlur={handleBlur}>
          <button
            onClick={handleMoreClick}
            className="
              p-2 rounded-lg
              text-foreground-muted
              hover:text-foreground
              hover:bg-muted
              transition-all duration-200
              active:scale-95
            "
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* More Menu Dropdown */}
          {showMoreMenu && (
            <div 
              className="
                absolute left-0 top-full mt-1 z-50
                bg-card-solid dark:bg-card-solid
                border border-border
                rounded-lg shadow-lg
                min-w-[140px]
                animate-fade-in
              "
            >
              <button
                onClick={handleDeleteClick}
                className="
                  w-full flex items-center gap-2 px-3 py-2
                  text-destructive
                  hover:bg-destructive/10
                  rounded-lg
                  transition-colors
                  text-sm font-medium
                "
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <div 
            className="
              bg-card-solid
              rounded-xl shadow-2xl
              p-6 max-w-sm w-full mx-4
              border border-border
              animate-scale-in
            "
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Signal?
            </h3>
            <p className="text-sm text-foreground-muted mb-6">
              This action cannot be undone. All responses will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="
                  flex-1 px-4 py-2.5
                  bg-muted
                  text-foreground
                  rounded-lg font-medium
                  hover:bg-muted/80
                  transition-colors
                "
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="
                  flex-1 px-4 py-2.5
                  bg-destructive hover:bg-destructive/90
                  text-destructive-foreground
                  rounded-lg font-medium
                  transition-colors
                "
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
