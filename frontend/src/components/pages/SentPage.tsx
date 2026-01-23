import { useState, useMemo } from 'react';
import { Poll, Response, User } from '../../types';
import { PageHeader, StatusFilterCards } from '../layout';
import type { StatusFilter } from '../layout';
import PublishedPolls from '../PublishedPolls';
import ScheduledPolls from '../ScheduledPolls';
import { EmptyState } from '../signals';
import { Send } from 'lucide-react';

interface SentPageProps {
  user: User;
  polls: Poll[];
  responses: Response[];
  onDeletePoll: (pollId: string) => void;
  onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
}

/**
 * SentPage Component
 * 
 * Publisher view showing:
 * - Status filter cards (All, Published, Scheduled)
 * - Published and scheduled signal lists
 */
export default function SentPage({
  user,
  polls,
  responses,
  onDeletePoll,
  onUpdatePoll,
}: SentPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter polls by publisher
  const userPolls = useMemo(() => 
    polls.filter(p => p.publisherEmail === user.email), 
    [polls, user.email]
  );

  const activePolls = useMemo(() => 
    userPolls.filter(p => p.status !== 'scheduled'), 
    [userPolls]
  );

  const scheduledPolls = useMemo(() => 
    userPolls.filter(p => p.status === 'scheduled'), 
    [userPolls]
  );

  // Status counts
  const counts = useMemo(() => ({
    all: userPolls.length,
    incomplete: activePolls.length, // Using "incomplete" slot for "published"
    completed: 0,
    draft: scheduledPolls.length,
  }), [userPolls.length, activePolls.length, scheduledPolls.length]);

  // Get filtered polls based on status
  const { filteredPublished, filteredScheduled } = useMemo(() => {
    switch (statusFilter) {
      case 'incomplete': // Published
        return { filteredPublished: activePolls, filteredScheduled: [] };
      case 'draft': // Scheduled
        return { filteredPublished: [], filteredScheduled: scheduledPolls };
      case 'all':
      default:
        return { filteredPublished: activePolls, filteredScheduled: scheduledPolls };
    }
  }, [statusFilter, activePolls, scheduledPolls]);

  const hasNoSignals = filteredPublished.length === 0 && filteredScheduled.length === 0;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Sent"
        subtitle={`${activePolls.length} published, ${scheduledPolls.length} scheduled`}
        showCreateButton={true}
      />

      {/* Status Filter Cards */}
      <StatusFilterCards
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        counts={counts}
        showDraft={true}
      />

      {/* Signal Lists */}
      {hasNoSignals ? (
        <EmptyState
          type="sent"
          action={{
            label: 'Create Signal',
            onClick: () => {
              // Trigger create panel - this will be handled via layout context
              const event = new CustomEvent('ribbit:openCreatePanel');
              window.dispatchEvent(event);
            },
          }}
        />
      ) : (
        <div className="space-y-8">
          {/* Scheduled Signals */}
          {filteredScheduled.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Scheduled
              </h3>
              <ScheduledPolls
                polls={filteredScheduled}
                currentUserEmail={user.email}
                onDeletePoll={onDeletePoll}
                onUpdatePoll={onUpdatePoll}
              />
            </section>
          )}

          {/* Published Signals */}
          {filteredPublished.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ribbit-fern"></span>
                Published
              </h3>
              <PublishedPolls
                polls={filteredPublished}
                responses={responses}
                currentUserEmail={user.email}
                onDeletePoll={onDeletePoll}
                onUpdatePoll={onUpdatePoll}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
