import { useState } from 'react';
import { Poll, Response } from '../types';
import { mapResultsToResponses } from '../services/pollService';
import { BarChart3 } from 'lucide-react';
import AnalyticsView from './AnalyticsView';
import EditPollModal from './EditPollModal';
import { SignalRow } from './signals';

interface PublishedPollsProps {
  polls: Poll[];
  responses: Response[];
  currentUserEmail: string;
  onDeletePoll: (pollId: string) => void;
  onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
}

/**
 * PublishedPolls Component
 * 
 * Displays published signals using the new SignalRow expandable design.
 * Shows edit/delete actions for publishers.
 */
export default function PublishedPolls({
  polls,
  responses,
  currentUserEmail,
  onDeletePoll,
  onUpdatePoll
}: PublishedPollsProps) {
  const [selectedPollForAnalytics, setSelectedPollForAnalytics] = useState<Poll | null>(null);
  const [analyticsResponses, setAnalyticsResponses] = useState<Response[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedPollForEdit, setSelectedPollForEdit] = useState<Poll | null>(null);

  // Sort polls: active first (by deadline), then expired (by most recent)
  const sortedPolls = [...polls].sort((a, b) => {
    const now = new Date();
    const timeA = new Date(a.deadline).getTime();
    const timeB = new Date(b.deadline).getTime();

    const isExpiredA = a.status === 'completed' || timeA < now.getTime();
    const isExpiredB = b.status === 'completed' || timeB < now.getTime();

    if (isExpiredA !== isExpiredB) {
      return isExpiredA ? 1 : -1;
    }

    if (isExpiredA) {
      return timeB - timeA;
    }

    return timeA - timeB;
  });

  const handleAnalyticsClick = async (poll: Poll) => {
    setSelectedPollForAnalytics(poll);
    setLoadingAnalytics(true);
    setAnalyticsResponses([]);

    try {
      let fetchedResponses: Response[] = [];

      if (poll.cloudSignalId && (window as any).electron?.backend) {
        try {
          const result = await (window as any).electron.backend.getPollResults(poll.cloudSignalId);

          if (result.success && result.data) {
            fetchedResponses = mapResultsToResponses(result.data, poll);
          } else {
            fetchedResponses = responses.filter(r => r.pollId === poll.id);
          }
        } catch (error) {
          console.error('[PublishedPolls] Error fetching from backend:', error);
          fetchedResponses = responses.filter(r => r.pollId === poll.id);
        }
      } else {
        fetchedResponses = responses.filter(r => r.pollId === poll.id);
      }

      setAnalyticsResponses(fetchedResponses);
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleEditClick = (poll: Poll) => {
    setSelectedPollForEdit(poll);
  };

  // Get user response for a poll (if publisher is also a consumer)
  const getUserResponse = (pollId: string) => {
    return responses.find(r => r.pollId === pollId && r.consumerEmail === currentUserEmail);
  };

  if (polls.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-10 h-10 text-ribbit-fern dark:text-ribbit-dry-sage" />
        </div>
        <h3 className="text-ribbit-hunter-green dark:text-ribbit-dust-grey text-lg font-semibold mb-2">
          No Signals Published Yet
        </h3>
        <p className="text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 mb-6">
          Create your first signal to start collecting responses
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="space-y-3">
        {sortedPolls.map((poll, index) => (
          <div
            key={poll.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="animate-fade-in-up"
          >
            <SignalRow
              poll={poll}
              userResponse={getUserResponse(poll.id)}
              viewMode="sent"
              currentUserEmail={currentUserEmail}
              isPublisher={true}
              onAnalytics={handleAnalyticsClick}
              onEdit={handleEditClick}
              onDelete={onDeletePoll}
            />
          </div>
        ))}
      </div>

      {/* Analytics Modal */}
      {selectedPollForAnalytics && !loadingAnalytics && (
        <AnalyticsView
          poll={selectedPollForAnalytics}
          responses={analyticsResponses}
          onClose={() => {
            setSelectedPollForAnalytics(null);
            setAnalyticsResponses([]);
          }}
          canExport={true}
        />
      )}

      {/* Loading Analytics Overlay */}
      {loadingAnalytics && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-ribbit-hunter-green rounded-xl p-6 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-ribbit-fern/30 border-t-ribbit-fern rounded-full animate-spin" />
            <p className="text-ribbit-hunter-green dark:text-ribbit-dust-grey font-medium">
              Loading analytics...
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedPollForEdit && (
        <EditPollModal
          poll={selectedPollForEdit}
          onUpdate={onUpdatePoll}
          onClose={() => setSelectedPollForEdit(null)}
        />
      )}
    </div>
  );
}
