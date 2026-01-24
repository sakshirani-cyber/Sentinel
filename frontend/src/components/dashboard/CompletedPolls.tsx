import { useState } from 'react';
import { Poll, Response, User } from '../../types';
import { SignalRow, EmptyState } from '../signals';
import { useLayout } from '../layout/LayoutContext';
import { mapResultsToResponses } from '../../services/pollService';

interface CompletedPollsProps {
  polls: Poll[];
  responses: Response[];
  user: User;
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
}: CompletedPollsProps) {
  const { openAnalyticsPanel } = useLayout();
  const [loadingAnalyticsPollId, setLoadingAnalyticsPollId] = useState<string | null>(null);
  
  const getUserResponse = (pollId: string) => {
    return responses.find(r => r.pollId === pollId && r.consumerEmail === user.email);
  };

  const handleAnalytics = async (poll: Poll) => {
    setLoadingAnalyticsPollId(poll.id);
    
    try {
      // Get local responses for this poll
      let fetchedResponses = responses.filter(r => r.pollId === poll.id);
      
      // Fetch backend responses if available
      if (poll.cloudSignalId && (window as any).electron?.backend) {
        try {
          const result = await (window as any).electron.backend.getPollResults(poll.cloudSignalId);
          if (result.success && result.data) {
            fetchedResponses = mapResultsToResponses(result.data, poll);
          }
        } catch (error) {
          console.error('[CompletedPolls] Error fetching from backend:', error);
        }
      }
      
      // Open the analytics panel with poll and responses
      openAnalyticsPanel(poll, fetchedResponses);
    } finally {
      setLoadingAnalyticsPollId(null);
    }
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
                onAnalytics={handleAnalytics}
                loadingAnalytics={loadingAnalyticsPollId === poll.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
