import { Poll, Response } from '../App';
import { Clock, User, Shield, AlertCircle, CheckCircle, XCircle, Edit, Tag } from 'lucide-react';
import LabelText from './LabelText';
import LabelPill from './LabelPill';
import { useState, useEffect } from 'react';

interface Label {
  id: string;
  name: string;
  description: string;
}

interface SignalCardProps {
  poll: Poll;
  hasDraft?: boolean;
  isCompleted?: boolean;
  userResponse?: Response;
  onClick?: () => void;
}

export default function SignalCard({ poll, hasDraft, isCompleted, userResponse, onClick }: SignalCardProps) {
  const [labels, setLabels] = useState<Label[]>([]);

  // Fetch labels on mount
  useEffect(() => {
    const fetchLabels = async () => {
      if ((window as any).electron?.db) {
        try {
          const result = await (window as any).electron.db.getLabels();
          setLabels(result.success ? result.data : []);
        } catch (error) {
          console.error('Failed to fetch labels:', error);
        }
      }
    };
    fetchLabels();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return { text: 'Expired', isUrgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const isUrgent = hours < 1;

    if (days > 0) return { text: `${days}d ${hours}h remaining`, isUrgent: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m remaining`, isUrgent };
    return { text: `${minutes}m remaining`, isUrgent: true };
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div
      onClick={onClick}
      className={`
        group relative
        bg-card dark:bg-card
        backdrop-blur-sm
        border rounded-2xl shadow-sm transition-all duration-300 overflow-hidden
        shine-on-hover
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1 hover:border-primary/40' : 'cursor-default'}
        ${timeRemaining.isUrgent && !isCompleted 
          ? 'border-destructive/40 dark:border-destructive/50 bg-destructive/5 dark:bg-destructive/10' 
          : 'border-border'
        }
      `}
    >
      {/* Urgent indicator bar */}
      {timeRemaining.isUrgent && !isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive via-destructive to-destructive animate-pulse" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground-secondary">From:</span>
              <span className="text-sm font-medium text-foreground">{poll.publisherName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Clock className="w-4 h-4" />
              <span>Deadline: {formatDateTime(poll.deadline)}</span>
            </div>
          </div>

          {!isCompleted && (
            <div className="text-right">
              <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-medium ${timeRemaining.isUrgent
                ? 'bg-destructive/10 dark:bg-destructive/20 text-destructive border border-destructive/30'
                : 'bg-primary/10 dark:bg-primary/20 text-primary border border-primary/30'
                }`}>
                {timeRemaining.text}
              </span>
            </div>
          )}
        </div>

        {/* Question */}
        <h3 className="text-foreground text-base font-semibold mb-3 break-words group-hover:text-primary transition-colors">
          <LabelText text={poll.question} labels={labels} />
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <Shield className="w-4 h-4" />
            <span className="capitalize">{poll.anonymityMode}</span>
          </div>

          <div className="px-2 py-0.5 bg-primary/10 dark:bg-primary/15 text-primary rounded-lg border border-primary/20">
            Poll
          </div>

          {poll.isPersistentFinalAlert && !isCompleted && (
            <div className="px-2 py-0.5 bg-destructive/10 dark:bg-destructive/20 text-destructive rounded-lg flex items-center gap-1 border border-destructive/30">
              <AlertCircle className="w-3 h-3" />
              Persistent
            </div>
          )}

          {hasDraft && !isCompleted && (
            <div className="px-2 py-0.5 bg-warning/10 dark:bg-warning/20 text-warning rounded-lg border border-warning/30">
              DRAFT
            </div>
          )}

          {poll.showDefaultToConsumers && !isCompleted && (
            <div className="px-2 py-0.5 bg-muted text-muted-foreground rounded-lg text-xs break-all max-w-full border border-border">
              Default: {poll.defaultResponse}
            </div>
          )}

          {poll.isEdited && (
            <div className="px-2 py-0.5 bg-info/10 dark:bg-info/20 text-info rounded-lg flex items-center gap-1 border border-info/30">
              <Edit className="w-3 h-3" />
              Edited
            </div>
          )}
        </div>

        {/* Labels */}
        {poll.labels && poll.labels.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-foreground-muted" />
            <LabelPill labels={poll.labels} />
          </div>
        )}

        {/* Response Display (if completed) */}
        {isCompleted && userResponse && (
          <div className={`p-3 rounded-xl mb-3 border ${userResponse.isDefault
            ? 'bg-destructive/10 dark:bg-destructive/15 border-destructive/30'
            : userResponse.skipReason
              ? 'bg-warning/10 dark:bg-warning/15 border-warning/30'
              : 'bg-success/10 dark:bg-success/15 border-success/30'
            }`}>
            <div className="flex items-start gap-2">
              {userResponse.isDefault ? (
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              ) : userResponse.skipReason ? (
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm mb-1 font-medium ${userResponse.isDefault ? 'text-destructive' :
                  userResponse.skipReason ? 'text-warning' : 'text-success'
                  }`}>
                  {userResponse.isDefault ? (
                    <strong>Default response taken</strong>
                  ) : userResponse.skipReason ? (
                    <strong>Skipped</strong>
                  ) : (
                    <strong>Your Response:</strong>
                  )}
                </p>
                <p className="text-sm text-foreground">
                  <LabelText text={userResponse.response} labels={labels} />
                </p>
                {userResponse.skipReason && (
                  <p className="text-xs text-warning mt-1 italic">
                    Reason: "{userResponse.skipReason}"
                  </p>
                )}
                <p className="text-xs text-foreground-muted mt-1">
                  {formatDateTime(userResponse.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
