import { Poll } from '../App';
import { X, Clock, User, Shield, AlertCircle } from 'lucide-react';
import LabelPill from './LabelPill';
import LabelText from './LabelText';

interface PollPreviewProps {
  poll: Poll;
  onClose: () => void;
}

export default function PollPreview({ poll, onClose }: PollPreviewProps) {
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

  const getTimeRemaining = () => {
    const now = new Date();
    const deadline = new Date(poll.deadline);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-x-hidden overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-slate-900 mb-1">Preview Poll</h2>
            <p className="text-sm text-slate-600">
              How this will appear to consumers
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8">

          {/* Consumer Dashboard View */}
          <div>
            <h3 className="text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Consumer Dashboard View
            </h3>
            <div className="bg-white border border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              {/* Signal Card */}
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-600">From:</span>
                      <span className="text-sm text-slate-900 break-all max-w-full" style={{ wordBreak: 'break-all' }}>{poll.publisherName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>Deadline: {formatDateTime(poll.deadline)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${getTimeRemaining().includes('remaining')
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {getTimeRemaining()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{poll.anonymityMode}</span>
                  </div>
                  <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                    Poll
                  </div>
                  {poll.isPersistentFinalAlert && (
                    <div className="px-2 py-0.5 bg-red-50 text-red-700 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Persistent Alert Enabled (1-min)
                    </div>
                  )}
                </div>
                {poll.labels && poll.labels.length > 0 && (
                  <div className="px-5 pb-3">
                    <LabelPill labels={poll.labels} />
                  </div>
                )}
              </div>

              {/* Poll Content */}
              <div className="p-5">
                <h4 className="text-slate-900 mb-4 break-all whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                  <LabelText text={poll.question} />
                </h4>
                {poll.labels && poll.labels.length > 0 && (
                  <div className="mb-4">
                    <LabelPill labels={poll.labels} />
                  </div>
                )}

                {poll.showDefaultToConsumers && poll.defaultResponse && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong className="break-all max-w-full" style={{ wordBreak: 'break-all' }}>Default Response:</strong> <span className="break-all max-w-full" style={{ wordBreak: 'break-all' }}>
                        <LabelText text={poll.defaultResponse || 'None'} />
                      </span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      This will be recorded if you don't submit a response
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {poll.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="preview-poll"
                        className="w-4 h-4 text-blue-600"
                        disabled
                      />
                      <span className="text-slate-700 break-all min-w-0 whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                        <LabelText text={option.text} />
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  disabled
                  className="w-full bg-blue-600 text-white py-3 rounded-lg opacity-50 cursor-not-allowed"
                >
                  Submit Response
                </button>
              </div>
            </div>

            {/* Alert Info */}
            {poll.isPersistentFinalAlert && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Persistent Window Alert</p>
                    <p className="text-xs text-red-700">This signal will lock the screen for a mandatory response 1 minute before deadline.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
