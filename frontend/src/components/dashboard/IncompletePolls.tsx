import { Poll } from '../../types';
import { SignalListItem, EmptyState } from '../signals';

interface IncompletePollsProps {
  polls: Poll[];
  drafts: Record<string, string>;
  onSelectPoll: (poll: Poll) => void;
}

/**
 * IncompletePolls Component
 * 
 * Displays pending signals sorted by nearest deadline.
 * Uses the new Ribbit design system components.
 */
export default function IncompletePolls({ polls, drafts, onSelectPoll }: IncompletePollsProps) {
  if (polls.length === 0) {
    return <EmptyState type="inbox" />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-1">
          Pending Signals
        </h2>
        <p className="text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          Sorted by nearest deadline first
        </p>
      </div>

      {/* Signal List */}
      <div className="space-y-3">
        {polls.map((poll, index) => (
          <div
            key={poll.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="animate-fade-in-up"
          >
            <SignalListItem
              poll={poll}
              hasDraft={!!drafts[poll.id]}
              onClick={() => onSelectPoll(poll)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
