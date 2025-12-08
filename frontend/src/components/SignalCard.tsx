import { Poll, Response } from '../App';
import { Clock, User, Shield, AlertCircle, Copy, CheckCircle, XCircle } from 'lucide-react';

interface SignalCardProps {
  poll: Poll;
  hasDraft?: boolean;
  isCompleted?: boolean;
  userResponse?: Response;
  onClick?: () => void;
}

export default function SignalCard({ poll, hasDraft, isCompleted, userResponse, onClick }: SignalCardProps) {
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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Signal: ${poll.question}\nFrom: ${poll.publisherName}\nDeadline: ${formatDateTime(poll.deadline)}\nID: ${poll.id}`;
    navigator.clipboard.writeText(text);
    
    // Could add a toast notification here
    alert('Signal details copied to clipboard!');
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div
      onClick={onClick}
      className={`bg-mono-bg border-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
        timeRemaining.isUrgent && !isCompleted ? 'border-red-300 bg-red-50' : 'border-mono-primary/20'
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-mono-text/60" />
              <span className="text-sm text-mono-text/70">From:</span>
              <span className="text-sm text-mono-text">{poll.publisherName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-mono-text/60">
              <Clock className="w-4 h-4" />
              <span>Deadline: {formatDateTime(poll.deadline)}</span>
            </div>
          </div>
          
          {!isCompleted && (
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                timeRemaining.isUrgent 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-mono-accent/20 text-mono-primary'
              }`}>
                {timeRemaining.text}
              </span>
            </div>
          )}
        </div>

        {/* Question */}
        <h3 className="text-mono-text mb-3">{poll.question}</h3>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-mono-text/70">
            <Shield className="w-4 h-4" />
            <span className="capitalize">{poll.anonymityMode}</span>
          </div>
          
          <div className="px-2 py-0.5 bg-mono-accent/20 text-mono-primary rounded">
            Poll
          </div>

          {poll.isPersistentAlert && !isCompleted && (
            <div className="px-2 py-0.5 bg-red-50 text-red-700 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Persistent
            </div>
          )}

          {hasDraft && !isCompleted && (
            <div className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded">
              DRAFT
            </div>
          )}

          {poll.showDefaultToConsumers && !isCompleted && (
            <div className="px-2 py-0.5 bg-mono-primary/10 text-mono-text/70 rounded text-xs">
              Default: {poll.defaultResponse}
            </div>
          )}
        </div>

        {/* Response Display (if completed) */}
        {isCompleted && userResponse && (
          <div className={`p-3 rounded-lg mb-3 ${
            userResponse.isDefault 
              ? 'bg-red-100 border border-red-200' 
              : userResponse.skipReason 
              ? 'bg-yellow-100 border border-yellow-200'
              : 'bg-mono-accent/20 border border-mono-accent/30'
          }`}>
            <div className="flex items-start gap-2">
              {userResponse.isDefault ? (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : userResponse.skipReason ? (
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-mono-primary flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm mb-1 ${
                  userResponse.isDefault ? 'text-red-900' : 
                  userResponse.skipReason ? 'text-yellow-900' : 'text-mono-primary'
                }`}>
                  {userResponse.isDefault ? (
                    <strong>Default response taken</strong>
                  ) : userResponse.skipReason ? (
                    <strong>Skipped</strong>
                  ) : (
                    <strong>Your Response:</strong>
                  )}
                </p>
                <p className={`text-sm ${
                  userResponse.isDefault ? 'text-red-700' : 
                  userResponse.skipReason ? 'text-yellow-700' : 'text-mono-primary'
                }`}>
                  {userResponse.response}
                </p>
                {userResponse.skipReason && (
                  <p className="text-xs text-yellow-600 mt-1 italic">
                    Reason: "{userResponse.skipReason}"
                  </p>
                )}
                <p className="text-xs text-mono-text/60 mt-1">
                  {formatDateTime(userResponse.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Signal ID and Copy */}
        <div className="flex items-center justify-between pt-3 border-t border-mono-primary/20">
          <span className="text-xs text-mono-text/60 font-mono">ID: {poll.id}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-mono-text/70 hover:text-mono-text hover:bg-mono-primary/5 rounded transition-colors"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}