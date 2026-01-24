import { BarChart3, Edit, Trash2, Loader2 } from 'lucide-react';
import { Poll } from '../../types';

interface SignalRowActionsProps {
  poll: Poll;
  isCreator: boolean;
  isCompleted: boolean;
  viewMode: 'inbox' | 'sent';
  onAnalytics?: (poll: Poll) => void;
  onEdit?: (poll: Poll) => void;
  onDeleteClick?: () => void;
  loadingAnalytics?: boolean;
}

/**
 * SignalRowActions Component
 * 
 * Action buttons displayed on the left side of signal rows:
 * - Analytics: Visible to all users
 * - Edit: Only for creator, non-completed signals
 * - Delete: Only for creator, non-completed signals (direct button, no dropdown)
 * 
 * Note: Delete confirmation is handled by parent SignalRow component
 */
export default function SignalRowActions({
  poll,
  isCreator,
  isCompleted,
  viewMode,
  onAnalytics,
  onEdit,
  onDeleteClick,
  loadingAnalytics = false,
}: SignalRowActionsProps) {
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
    onDeleteClick?.();
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
          "
          title="Delete Signal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
