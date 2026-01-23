import { useState } from 'react';
import { Poll } from '../types';
import { Calendar } from 'lucide-react';
import EditPollModal from './EditPollModal';
import { SignalRow } from './signals';

interface ScheduledPollsProps {
  polls: Poll[];
  currentUserEmail: string;
  onDeletePoll: (pollId: string) => void;
  onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
}

/**
 * ScheduledPolls Component
 * 
 * Displays scheduled signals using the new SignalRow expandable design.
 */
export default function ScheduledPolls({
  polls,
  currentUserEmail,
  onDeletePoll,
  onUpdatePoll
}: ScheduledPollsProps) {
  const [selectedPollForEdit, setSelectedPollForEdit] = useState<Poll | null>(null);

  const sortedPolls = [...polls].sort((a, b) => {
    // Sort by scheduled time, soonest first
    const timeA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
    const timeB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
    return timeA - timeB;
  });

  if (polls.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-10 h-10 text-ribbit-fern dark:text-ribbit-dry-sage" />
        </div>
        <h3 className="text-ribbit-hunter-green dark:text-ribbit-dust-grey text-lg font-semibold mb-2">
          No Scheduled Signals
        </h3>
        <p className="text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 mb-6">
          Schedule signals to be published automatically at a future time
        </p>
      </div>
    );
  }

  const handleEditClick = (poll: Poll) => {
    setSelectedPollForEdit(poll);
  };

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
              viewMode="sent"
              currentUserEmail={currentUserEmail}
              isPublisher={true}
              onEdit={handleEditClick}
              onDelete={onDeletePoll}
            />
          </div>
        ))}
      </div>

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
