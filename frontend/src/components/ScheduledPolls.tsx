import { useState } from 'react';
import { Poll } from '../App';
import { Clock, Calendar, Edit, Trash2, Send } from 'lucide-react';
import EditPollModal from './EditPollModal';
import LabelPill from './LabelPill';
import LabelText from './LabelText';

interface ScheduledPollsProps {
    polls: Poll[];
    onDeletePoll: (pollId: string) => void;
    onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
    onPublishNow: (poll: Poll) => void;
}

export default function ScheduledPolls({
    polls,
    onDeletePoll,
    onUpdatePoll,
    onPublishNow
}: ScheduledPollsProps) {
    const [selectedPollForEdit, setSelectedPollForEdit] = useState<Poll | null>(null);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const sortedPolls = [...polls].sort((a, b) => {
        // Sort by scheduled time, soonest first
        const timeA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
        const timeB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
        return timeA - timeB;
    });

    if (polls.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-mono-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-mono-primary/40" />
                </div>
                <h3 className="text-mono-text mb-2">No Scheduled Polls</h3>
                <p className="text-mono-text/60 mb-6">
                    Schedule polls to be published automatically at a future time
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-mono-text text-xl font-medium mb-2">Scheduled Polls</h2>
                <p className="text-mono-text/60">
                    These polls will be automatically published at their scheduled time
                </p>
            </div>

            <div className="space-y-4">
                {sortedPolls.map((poll) => (
                    <div
                        key={poll.id}
                        className="bg-mono-bg border border-mono-primary/10 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium border border-blue-100">
                                            <Clock className="w-3 h-3" />
                                            Scheduled
                                        </span>
                                    </div>
                                    <h3 className="text-mono-text text-lg font-medium mb-2 break-all whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                                        <LabelText text={poll.question} />
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-mono-text/60">
                                        <Calendar className="w-4 h-4" />
                                        Scheduled for: <span className="font-medium text-mono-text">{poll.scheduledFor ? formatDateTime(poll.scheduledFor) : 'N/A'}</span>
                                    </div>
                                    {poll.labels && poll.labels.length > 0 && (
                                        <div className="mt-4">
                                            <LabelPill labels={poll.labels} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-mono-primary/5">
                                <button
                                    onClick={() => onPublishNow(poll)}
                                    className="flex items-center gap-2 px-4 py-2 bg-mono-accent text-mono-primary rounded-lg hover:bg-mono-accent/90 transition-colors text-sm font-medium shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    Publish Now
                                </button>
                                <button
                                    onClick={() => setSelectedPollForEdit(poll)}
                                    className="flex items-center gap-2 px-4 py-2 bg-mono-primary/5 text-mono-text rounded-lg hover:bg-mono-primary/10 transition-colors text-sm font-medium"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this scheduled poll?')) {
                                            onDeletePoll(poll.id);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm ml-auto border border-red-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
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
