import { Poll, Response, User } from '../../types';
import SignalCard from '../SignalCard';
import { CheckCircle } from 'lucide-react';

interface CompletedPollsProps {
    polls: Poll[];
    responses: Response[];
    user: User;
}

export default function CompletedPolls({ polls, responses, user }: CompletedPollsProps) {
    const getUserResponse = (pollId: string) => {
        return responses.find(r => r.pollId === pollId && r.consumerEmail === user.email);
    };

    if (polls.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-mono-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-mono-primary/40" />
                </div>
                <h3 className="text-mono-text mb-2">No Submissions Yet</h3>
                <p className="text-mono-text/60">
                    Your completed signals will appear here
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <h2 className="text-mono-text mb-2">Your Submissions</h2>
                <p className="text-mono-text/60">
                    View your completed signals and responses
                </p>
            </div>
            {polls.map(poll => {
                const userResponse = getUserResponse(poll.id);
                return (
                    <div
                        key={poll.id}
                        className={`bg-mono-bg border-2 rounded-xl shadow-sm p-5 ${userResponse?.isDefault ? 'border-red-400 bg-red-50' : 'border-mono-primary/20'
                            }`}
                    >
                        <SignalCard
                            poll={poll}
                            isCompleted
                            userResponse={userResponse}
                        />
                    </div>
                );
            })}
        </div>
    );
}
