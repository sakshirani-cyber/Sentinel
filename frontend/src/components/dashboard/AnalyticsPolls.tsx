import { Poll } from '../../types';
import LabelText from '../LabelText';
import { Clock, AlertTriangle, BarChart3 } from 'lucide-react';

interface AnalyticsPollsProps {
    polls: Poll[];
    selectedPollForAnalytics: Poll | null;
    loadingAnalytics: boolean;
    onAnalyticsClick: (poll: Poll) => void;
}

export default function AnalyticsPolls({ polls, selectedPollForAnalytics, loadingAnalytics, onAnalyticsClick }: AnalyticsPollsProps) {
    if (polls.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-mono-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-10 h-10 text-mono-primary/40" />
                </div>
                <h3 className="text-mono-text mb-2">No Polls Available</h3>
                <p className="text-mono-text/60">
                    You haven't been assigned to any polls yet
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {polls.map(poll => {
                const totalConsumers = poll.consumers.length;

                return (
                    <div
                        key={poll.id}
                        className="bg-mono-bg border border-mono-primary/10 rounded-xl shadow-sm hover:shadow-md transition-all p-5"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-mono-text text-lg font-medium mb-2 break-all max-w-full" style={{ wordBreak: 'break-all' }}>
                                    <LabelText text={poll.question} />
                                </h3>
                                <div className="flex flex-wrap gap-3 text-sm text-mono-text/60">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        Deadline: {new Date(poll.deadline).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2 text-mono-text/60">
                                <AlertTriangle className="w-4 h-4" />
                                <span>{totalConsumers} consumers</span>
                            </div>
                        </div>

                        <button
                            onClick={() => onAnalyticsClick(poll)}
                            disabled={loadingAnalytics && selectedPollForAnalytics?.id === poll.id}
                            className="flex items-center gap-2 px-4 py-2 bg-mono-primary text-mono-bg rounded-lg hover:bg-mono-primary/90 transition-colors text-sm font-medium disabled:opacity-70"
                        >
                            {loadingAnalytics && selectedPollForAnalytics?.id === poll.id ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-mono-bg/30 border-t-mono-bg rounded-full animate-spin" />
                                    <span>Loading...</span>
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-4 h-4" />
                                    <span>View Analytics</span>
                                </>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
