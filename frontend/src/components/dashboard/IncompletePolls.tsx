import { Poll } from '../../types';
import SignalCard from '../SignalCard';
import { CheckCircle } from 'lucide-react';

interface IncompletePollsProps {
    polls: Poll[];
    drafts: Record<string, string>;
    onSelectPoll: (poll: Poll) => void;
}

export default function IncompletePolls({ polls, drafts, onSelectPoll }: IncompletePollsProps) {
    if (polls.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-mono-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-mono-accent" />
                </div>
                <h3 className="text-mono-text mb-2">All Caught Up!</h3>
                <p className="text-mono-text/60">
                    You don't have any pending signals at the moment
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <h2 className="text-mono-text mb-2">Pending Signals</h2>
                <p className="text-mono-text/60">
                    Signals are sorted by nearest deadline first
                </p>
            </div>
            {polls.map(poll => (
                <SignalCard
                    key={poll.id}
                    poll={poll}
                    hasDraft={!!drafts[poll.id]}
                    onClick={() => onSelectPoll(poll)}
                />
            ))}
        </div>
    );
}
