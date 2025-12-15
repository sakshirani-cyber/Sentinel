import { Poll, Response } from '../App';
import { X, TrendingUp, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AnalyticsViewProps {
  poll: Poll;
  responses: Response[];
  onClose: () => void;
}

export default function AnalyticsView({ poll, responses, onClose }: AnalyticsViewProps) {
  const totalConsumers = poll.consumers.length;
  const totalResponses = responses.length;
  const responseRate = totalConsumers > 0 ? (totalResponses / totalConsumers) * 100 : 0;

  const submittedResponses = responses.filter(r => !r.isDefault);
  const defaultResponses = responses.filter(r => r.isDefault);
  const skippedResponses = responses.filter(r => r.skipReason);

  // Count responses by option
  const responseCounts = poll.options.reduce((acc, option) => {
    acc[option.text] = responses.filter(r => r.response === option.text).length;
    return acc;
  }, {} as Record<string, number>);

  // Add default response count if it's not in options
  const defaultResponseIsOption = poll.options.some(opt => opt.text === poll.defaultResponse);
  if (poll.defaultResponse && !defaultResponseIsOption && defaultResponses.length > 0) {
    responseCounts[poll.defaultResponse] = defaultResponses.filter(
      r => r.response === poll.defaultResponse
    ).length;
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-slate-900 mb-1">Poll Analytics</h2>
            <p className="text-sm text-slate-600">{poll.question}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-900">Total Consumers</span>
              </div>
              <p className="text-blue-900">{totalConsumers}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-900">Response Rate</span>
              </div>
              <p className="text-green-900">{responseRate.toFixed(1)}%</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-900">Submitted</span>
              </div>
              <p className="text-purple-900">{submittedResponses.length}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-900">Defaults</span>
              </div>
              <p className="text-amber-900">{defaultResponses.length}</p>
            </div>
          </div>

          {/* Response Distribution */}
          <div className="mb-8">
            <h3 className="text-slate-900 mb-4">Response Distribution</h3>
            <div className="space-y-3">
              {Object.entries(responseCounts).map(([option, count]) => {
                const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                const isDefaultOption = option === poll.defaultResponse;

                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 flex items-center gap-2">
                        {option}
                        {isDefaultOption && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="text-slate-600">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Responses (only if not anonymous) */}
          {poll.anonymityMode === 'record' && (
            <div>
              <h3 className="text-slate-900 mb-4">Individual Responses</h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm text-slate-700">Consumer</th>
                        <th className="text-left px-4 py-3 text-sm text-slate-700">Response</th>
                        <th className="text-left px-4 py-3 text-sm text-slate-700">Status</th>
                        <th className="text-left px-4 py-3 text-sm text-slate-700">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {responses.length > 0 ? (
                        responses.map((response, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-900">
                              {response.consumerEmail}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {response.response}
                            </td>
                            <td className="px-4 py-3">
                              {response.isDefault ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                                  <Clock className="w-3 h-3" />
                                  Default
                                </span>
                              ) : response.skipReason ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                  <XCircle className="w-3 h-3" />
                                  Skipped
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Submitted
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {formatDateTime(response.submittedAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                            No responses yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Consumers */}
              {poll.consumers.length > responses.length && (
                <div className="mt-6">
                  <h4 className="text-slate-700 mb-3">
                    Pending Responses ({poll.consumers.length - responses.length})
                  </h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap gap-2">
                      {poll.consumers
                        .filter(email => !responses.some(r => r.consumerEmail === email))
                        .map(email => (
                          <span
                            key={email}
                            className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-full text-sm"
                          >
                            {email}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Anonymous Mode Message */}
          {poll.anonymityMode === 'anonymous' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-blue-900 mb-2">Anonymous Poll</h4>
              <p className="text-sm text-blue-700">
                Individual responses are anonymous. Only aggregate data is shown.
              </p>
            </div>
          )}

          {/* Skipped Responses with Reasons */}
          {skippedResponses.length > 0 && poll.anonymityMode === 'record' && (
            <div className="mt-8">
              <h3 className="text-slate-900 mb-4">Skipped with Reasons</h3>
              <div className="space-y-3">
                {skippedResponses.map((response, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm text-red-900">{response.consumerEmail}</span>
                      <span className="text-xs text-red-600">
                        {formatDateTime(response.submittedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 italic">"{response.skipReason}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}
