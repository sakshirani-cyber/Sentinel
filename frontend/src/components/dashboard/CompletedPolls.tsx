import { Poll, Response, User } from '../../types';
import { SignalRow, EmptyState } from '../signals';

interface CompletedPollsProps {
  polls: Poll[];
  responses: Response[];
  user: User;
  onAnalytics?: (poll: Poll) => void;
}

/**
 * CompletedPolls Component
 * 
 * Displays completed signals with user responses.
 * Uses the new SignalRow expandable row design.
 */
export default function CompletedPolls({ 
  polls, 
  responses, 
  user,
  onAnalytics,
}: CompletedPollsProps) {
  const getUserResponse = (pollId: string) => {
    return responses.find(r => r.pollId === pollId && r.consumerEmail === user.email);
  };

  if (polls.length === 0) {
    return <EmptyState type="completed" />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Your Submissions
        </h2>
        <p className="text-sm text-foreground-secondary">
          View your completed signals and responses
        </p>
      </div>

      {/* Signal List */}
      <div className="space-y-3">
        {polls.map((poll, index) => {
          const userResponse = getUserResponse(poll.id);
          return (
            <div
              key={poll.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in-up"
            >
              <SignalRow
                poll={poll}
                userResponse={userResponse}
                viewMode="inbox"
                currentUserEmail={user.email}
                isPublisher={user.isPublisher}
                onAnalytics={onAnalytics}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
