import { Poll, Response, User } from '../../types';
import { SignalRow, EmptyState } from '../signals';

interface IncompletePollsProps {
  polls: Poll[];
  drafts: Record<string, string>;
  user: User;
  responses: Response[];
  onSubmitResponse: (pollId: string, value: string) => Promise<void>;
  onSaveDraft: (pollId: string, value: string) => void;
  onAnalytics?: (poll: Poll) => void;
}

/**
 * IncompletePolls Component
 * 
 * Displays pending signals sorted by nearest deadline.
 * Uses the new SignalRow expandable row design.
 */
export default function IncompletePolls({ 
  polls, 
  drafts, 
  user,
  responses,
  onSubmitResponse,
  onSaveDraft,
  onAnalytics,
}: IncompletePollsProps) {
  if (polls.length === 0) {
    return <EmptyState type="inbox" />;
  }

  const getUserResponse = (pollId: string) => {
    return responses.find(r => r.pollId === pollId && r.consumerEmail === user.email);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Pending Signals
        </h2>
        <p className="text-sm text-foreground-secondary">
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
            <SignalRow
              poll={poll}
              userResponse={getUserResponse(poll.id)}
              hasDraft={!!drafts[poll.id]}
              draft={drafts[poll.id]}
              viewMode="inbox"
              currentUserEmail={user.email}
              isPublisher={user.isPublisher}
              onSubmitResponse={onSubmitResponse}
              onSaveDraft={onSaveDraft}
              onAnalytics={onAnalytics}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
