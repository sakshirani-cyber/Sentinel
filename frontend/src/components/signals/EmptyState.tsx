import { ReactNode } from 'react';
import { 
  Inbox, 
  CheckCircle, 
  Send, 
  Tag, 
  Users, 
  Search,
  FileQuestion,
  LucideIcon 
} from 'lucide-react';

type EmptyStateType = 
  | 'inbox' 
  | 'completed' 
  | 'sent' 
  | 'labels' 
  | 'groups' 
  | 'search' 
  | 'signals'
  | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

const emptyStateConfig: Record<Exclude<EmptyStateType, 'custom'>, {
  icon: LucideIcon;
  title: string;
  description: string;
}> = {
  inbox: {
    icon: CheckCircle,
    title: 'All Caught Up!',
    description: "You don't have any pending signals at the moment.",
  },
  completed: {
    icon: CheckCircle,
    title: 'No Completed Signals',
    description: "Signals you've responded to will appear here.",
  },
  sent: {
    icon: Send,
    title: 'No Published Signals',
    description: "Signals you create and publish will appear here.",
  },
  labels: {
    icon: Tag,
    title: 'No Labels Yet',
    description: 'Create labels to organize your signals.',
  },
  groups: {
    icon: Users,
    title: 'No Groups Yet',
    description: 'Create groups to easily send signals to teams.',
  },
  search: {
    icon: Search,
    title: 'No Results Found',
    description: 'Try adjusting your search or filters.',
  },
  signals: {
    icon: FileQuestion,
    title: 'No Signals',
    description: 'There are no signals to display.',
  },
};

/**
 * EmptyState Component
 * 
 * Consistent empty state display with icon, title, description, and optional action.
 */
export default function EmptyState({
  type = 'signals',
  title,
  description,
  icon: CustomIcon,
  action,
  children,
}: EmptyStateProps) {
  const config = type !== 'custom' ? emptyStateConfig[type] : null;
  const Icon = CustomIcon || config?.icon || FileQuestion;
  const displayTitle = title || config?.title || 'Nothing Here';
  const displayDescription = description || config?.description || '';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {/* Icon Container */}
      <div className="w-20 h-20 rounded-full bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 flex items-center justify-center mb-6 shadow-lg">
        <Icon className="w-10 h-10 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 max-w-md mb-6">
        {displayDescription}
      </p>

      {/* Custom Children */}
      {children}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="
            px-5 py-2.5 rounded-lg font-medium
            bg-primary text-primary-foreground
            shadow-md hover:shadow-lg
            hover:opacity-90 hover:scale-[1.02]
            active:scale-[0.98]
            transition-all duration-200
          "
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
