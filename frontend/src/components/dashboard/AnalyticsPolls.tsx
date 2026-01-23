import { Poll } from '../../types';
import { EmptyState } from '../signals';
import LabelText from '../LabelText';
import LabelPill from '../LabelPill';
import { Clock, Users, BarChart3, ChevronRight, TrendingUp, Eye, CheckCircle } from 'lucide-react';

interface AnalyticsPollsProps {
  polls: Poll[];
  selectedPollForAnalytics: Poll | null;
  loadingAnalytics: boolean;
  onAnalyticsClick: (poll: Poll) => void;
}

/**
 * AnalyticsPolls Component
 * 
 * Displays polls with analytics view option.
 * Modern card-based design with earthy forest palette.
 */
export default function AnalyticsPolls({
  polls,
  selectedPollForAnalytics,
  loadingAnalytics,
  onAnalyticsClick,
}: AnalyticsPollsProps) {
  if (polls.length === 0) {
    return (
      <EmptyState
        type="custom"
        icon={BarChart3}
        title="No Analytics Available"
        description="Create and publish signals to see analytics data here."
      />
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusInfo = (poll: Poll) => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const isExpired = deadline < now;
    
    if (poll.status === 'completed' || isExpired) {
      return { label: 'Completed', color: 'bg-ribbit-dry-sage/50 text-ribbit-hunter-green dark:bg-ribbit-fern/30 dark:text-ribbit-dry-sage', icon: CheckCircle };
    }
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp };
  };

  return (
    <div className="animate-fade-in">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={BarChart3}
          label="Total Signals"
          value={polls.length}
          trend="+2 this week"
        />
        <StatCard
          icon={Users}
          label="Total Recipients"
          value={polls.reduce((sum, p) => sum + p.consumers.length, 0)}
        />
        <StatCard
          icon={Eye}
          label="Response Rate"
          value="87%"
          trend="+5% vs last month"
        />
      </div>

      {/* Signal List */}
      <div className="space-y-4">
        {polls.map((poll, index) => {
          const totalConsumers = poll.consumers.length;
          const isLoading = loadingAnalytics && selectedPollForAnalytics?.id === poll.id;
          const statusInfo = getStatusInfo(poll);
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={poll.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in-up"
            >
              <div
                className="
                  group relative
                  bg-white dark:bg-ribbit-hunter-green/40
                  backdrop-blur-sm
                  border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20
                  rounded-xl
                  shadow-sm hover:shadow-lg
                  transition-all duration-300
                  overflow-hidden
                "
              >
                {/* Accent Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-ribbit-fern to-ribbit-hunter-green opacity-60" />

                <div className="p-5 pl-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                        {poll.labels && poll.labels.length > 0 && (
                          <LabelPill labels={poll.labels} maxVisible={2} />
                        )}
                      </div>

                      {/* Question */}
                      <h3 className="text-base font-semibold text-ribbit-hunter-green dark:text-ribbit-dust-grey leading-snug group-hover:text-ribbit-pine-teal dark:group-hover:text-ribbit-dry-sage transition-colors">
                        <LabelText text={poll.question} />
                      </h3>
                    </div>

                    {/* View Analytics Button */}
                    <button
                      onClick={() => onAnalyticsClick(poll)}
                      disabled={isLoading}
                      className="
                        flex items-center gap-2 px-4 py-2.5
                        bg-ribbit-hunter-green text-ribbit-dust-grey
                        rounded-xl font-medium text-sm
                        shadow-md hover:shadow-lg
                        hover:bg-[#2f4a35] hover:scale-[1.02]
                        active:scale-[0.98]
                        transition-all duration-200
                        disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                        flex-shrink-0 ml-4
                      "
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-ribbit-dust-grey/30 border-t-ribbit-dust-grey rounded-full animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          <span>Analytics</span>
                          <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Meta Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>Due: {formatDate(poll.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{totalConsumers} recipient{totalConsumers !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-ribbit-fern animate-pulse" />
                      <span>{poll.options.length} options</span>
                    </div>
                  </div>

                  {/* Options Preview */}
                  <div className="mt-4 pt-4 border-t border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
                    <p className="text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 mb-2">Response Options:</p>
                    <div className="flex flex-wrap gap-2">
                      {poll.options.slice(0, 4).map((option, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 text-ribbit-hunter-green dark:text-ribbit-dry-sage border border-ribbit-fern/10 dark:border-ribbit-dry-sage/10"
                        >
                          {option.text.length > 25 ? option.text.slice(0, 25) + '...' : option.text}
                        </span>
                      ))}
                      {poll.options.length > 4 && (
                        <span className="px-2.5 py-1 rounded-lg text-xs bg-ribbit-pine-teal/10 text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
                          +{poll.options.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  trend?: string;
}) {
  return (
    <div className="bg-white dark:bg-ribbit-hunter-green/40 backdrop-blur-sm border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
        </div>
        <div>
          <p className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">{label}</p>
          <p className="text-xl font-bold text-ribbit-hunter-green dark:text-ribbit-dry-sage">{value}</p>
        </div>
      </div>
      {trend && (
        <p className="mt-2 text-xs text-ribbit-fern dark:text-ribbit-dry-sage/70">
          {trend}
        </p>
      )}
    </div>
  );
}
