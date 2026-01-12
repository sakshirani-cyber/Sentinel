import { useState } from 'react';
import { Poll, Response } from '../App';
import { mapResultsToResponses } from '../services/pollService';
import { Clock, Users, BarChart3, Trash2, Calendar, Edit, PenTool, X, Eye } from 'lucide-react';
import AnalyticsView from './AnalyticsView';
import EditPollModal from './EditPollModal';
import LabelPill from './LabelPill';
import LabelText from './LabelText';

interface PublishedPollsProps {
  polls: Poll[];
  responses: Response[];
  onDeletePoll: (pollId: string) => void;
  onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
}

export default function PublishedPolls({
  polls,
  responses,
  onDeletePoll,
  onUpdatePoll
}: PublishedPollsProps) {
  const [selectedPollForAnalytics, setSelectedPollForAnalytics] = useState<Poll | null>(null);
  const [analyticsResponses, setAnalyticsResponses] = useState<Response[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedPollForDetails, setSelectedPollForDetails] = useState<Poll | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsStats, setDetailsStats] = useState<{ total: number; responded: number } | null>(null);
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

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff < 0) return 'Completed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const handleDetailsClick = async (poll: Poll) => {
    setSelectedPollForDetails(poll);
    setDetailsStats(null);

    if (poll.cloudSignalId && (window as any).electron?.backend) {
      setLoadingDetails(true);
      try {
        const result = await (window as any).electron.backend.getPollResults(poll.cloudSignalId);
        if (result.success && result.data) {
          setDetailsStats({
            total: result.data.totalAssigned,
            responded: result.data.totalResponded
          });
        }
      } catch (error) {
        console.error('Error fetching poll details stats:', error);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const sortedPolls = [...polls].sort((a, b) => {
    const now = new Date();
    const timeA = new Date(a.deadline).getTime();
    const timeB = new Date(b.deadline).getTime();

    // Determine expiration status
    // Note: Poll is expired if status is 'completed' OR deadline passed
    const isExpiredA = a.status === 'completed' || timeA < now.getTime();
    const isExpiredB = b.status === 'completed' || timeB < now.getTime();

    // If one is expired and the other isn't, put expired last
    if (isExpiredA !== isExpiredB) {
      return isExpiredA ? 1 : -1;
    }

    // If both are expired, sort by deadline descending (newest expired first)
    if (isExpiredA) {
      return timeB - timeA;
    }

    // If both are active, sort by deadline ascending (closest deadline first)
    return timeA - timeB;
  });

  const handleAnalyticsClick = async (poll: Poll) => {
    setSelectedPollForAnalytics(poll);
    setLoadingAnalytics(true);
    setAnalyticsResponses([]); // Clear previous

    try {
      let fetchedResponses: Response[] = [];

      // 1. Try to fetch from Backend if synced
      if (poll.cloudSignalId && (window as any).electron?.backend) {
        console.log('[PublishedPolls] Fetching analytics from backend for:', poll.cloudSignalId);
        try {
          const result = await (window as any).electron.backend.getPollResults(poll.cloudSignalId);
          console.log('[PublishedPolls] Backend analytics result:', result);

          if (result.success && result.data) {
            // Convert backend DTO to frontend Response[]
            fetchedResponses = mapResultsToResponses(result.data, poll);
            console.log('[PublishedPolls] Mapped responses:', fetchedResponses);
          } else {
            console.warn('[PublishedPolls] Backend fetch failed or empty, falling back to local:', result.error);
            // Fallback to local
            fetchedResponses = responses.filter(r => r.pollId === poll.id);
          }
        } catch (error) {
          console.error('[PublishedPolls] Error fetching from backend:', error);
          // Fallback to local
          fetchedResponses = responses.filter(r => r.pollId === poll.id);
        }
      } else {
        // 2. Use local data if not synced
        console.log('[PublishedPolls] Poll not synced, using local data');
        fetchedResponses = responses.filter(r => r.pollId === poll.id);
      }

      setAnalyticsResponses(fetchedResponses);
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (polls.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-mono-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-10 h-10 text-mono-primary/40" />
        </div>
        <h3 className="text-mono-text mb-2">No Polls Published Yet</h3>
        <p className="text-mono-text/60 mb-6">
          Create your first poll to start collecting responses
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-mono-text text-xl font-medium mb-2">Published Polls</h2>
        <p className="text-mono-text/60">
          Manage and view analytics for your published polls
        </p>
      </div>

      <div className="space-y-4">
        {sortedPolls.map((poll) => {
          const isCompleted = poll.status === 'completed' || new Date(poll.deadline) < new Date();

          return (
            <div
              key={poll.id}
              className="bg-mono-bg border border-mono-primary/10 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {poll.isEdited && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-mono-accent/20 text-mono-primary text-xs rounded-full font-medium border border-mono-accent/30">
                          <PenTool className="w-3 h-3" />
                          Edited
                        </span>
                      )}
                    </div>
                    <h3 className="text-mono-text text-lg font-medium mb-2 break-all whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                      <LabelText text={poll.question} />
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-mono-text/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Published: {formatDateTime(poll.publishedAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Deadline: {formatDateTime(poll.deadline)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs mb-2 font-medium border ${isCompleted
                      ? 'bg-mono-primary/10 text-mono-text border-mono-primary/20'
                      : 'bg-mono-accent/20 text-mono-primary border-mono-accent/30'
                      }`}>
                      {isCompleted ? 'Completed' : getTimeRemaining(poll.deadline)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-mono-text/60">
                    <Users className="w-4 h-4" />
                    <span>{poll.consumers.length} consumers</span>
                  </div>
                  <div className="px-2 py-1 bg-mono-primary/5 text-mono-text/70 rounded text-xs capitalize border border-mono-primary/10">
                    {poll.anonymityMode}
                  </div>
                  {poll.labels && poll.labels.length > 0 && (
                    <div className="flex-grow">
                      <LabelPill labels={poll.labels} />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-mono-primary/5">
                  <button
                    onClick={() => handleDetailsClick(poll)}
                    className="flex items-center gap-2 px-4 py-2 bg-mono-primary/5 text-mono-text rounded-lg hover:bg-mono-primary/10 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    More
                  </button>
                  <button
                    onClick={() => handleAnalyticsClick(poll)}
                    className="flex items-center gap-2 px-4 py-2 bg-mono-primary text-mono-bg rounded-lg hover:bg-mono-primary/90 transition-colors text-sm font-medium"
                    disabled={loadingAnalytics && selectedPollForAnalytics?.id === poll.id}
                  >
                    {loadingAnalytics && selectedPollForAnalytics?.id === poll.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-mono-bg/30 border-t-mono-bg rounded-full animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        <span>Analytics</span>
                      </>
                    )}
                  </button>
                  {!isCompleted && (
                    <button
                      onClick={() => setSelectedPollForEdit(poll)}
                      className="flex items-center gap-2 px-4 py-2 bg-mono-accent/20 text-mono-primary rounded-lg hover:bg-mono-accent/30 transition-colors text-sm font-medium border border-mono-accent/30"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {!isCompleted && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this poll?')) {
                          onDeletePoll(poll.id);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm ml-auto border border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Modal */}
      {selectedPollForAnalytics && !loadingAnalytics && (
        <AnalyticsView
          poll={selectedPollForAnalytics}
          responses={analyticsResponses}
          onClose={() => {
            setSelectedPollForAnalytics(null);
            setAnalyticsResponses([]);
          }}
          canExport={true}
        />
      )}

      {/* Edit Modal */}
      {selectedPollForEdit && (
        <EditPollModal
          poll={selectedPollForEdit}
          onUpdate={onUpdatePoll}
          onClose={() => setSelectedPollForEdit(null)}
        />
      )}

      {/* Details Modal */}
      {selectedPollForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-mono-bg rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-x-hidden overflow-y-auto flex flex-col border border-mono-primary/10 animate-in zoom-in-95 duration-200">
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-mono-primary/10 bg-mono-primary/5">
              <h2 className="text-mono-text text-lg font-medium">Poll Details</h2>
              <button
                onClick={() => setSelectedPollForDetails(null)}
                className="p-2 text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* Sync Status / Real-time Stats */}
              <div className="flex items-center justify-between p-4 bg-mono-accent/10 border border-mono-accent/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-mono-primary" />
                  <div>
                    <p className="text-sm font-medium text-mono-primary">Real-time Stats</p>
                  </div>
                </div>
                <div className="text-right">
                  {loadingDetails ? (
                    <div className="flex items-center gap-2 text-sm text-mono-text/60">
                      <div className="w-4 h-4 border-2 border-mono-primary/30 border-t-mono-primary rounded-full animate-spin" />
                      Syncing...
                    </div>
                  ) : detailsStats ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-mono-text">
                        {detailsStats.responded} / {detailsStats.total} Responded
                      </p>
                      <div className="w-24 bg-mono-primary/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-mono-accent h-full transition-all duration-500"
                          style={{ width: `${detailsStats.total > 0 ? (detailsStats.responded / detailsStats.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-mono-text/40">Stats unavailable</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-mono-text/60 mb-1 font-medium">Question</p>
                <p className="text-mono-text text-lg break-all whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                  <LabelText text={selectedPollForDetails.question} />
                </p>
              </div>
              {selectedPollForDetails.labels && selectedPollForDetails.labels.length > 0 && (
                <div>
                  <p className="text-sm text-mono-text/60 mb-2 font-medium">Labels</p>
                  <LabelPill labels={selectedPollForDetails.labels} />
                </div>
              )}
              <div>
                <p className="text-sm text-mono-text/60 mb-2 font-medium">Options</p>
                <ul className="space-y-2">
                  {selectedPollForDetails.options.map((opt, index) => (
                    <li key={opt.id || index} className="flex items-center gap-3 text-mono-text p-3 bg-mono-primary/5 rounded-lg border border-mono-primary/10">
                      <span className="w-2 h-2 bg-mono-accent rounded-full ring-2 ring-mono-accent/30"></span>
                      <span className="flex-1 min-w-0 break-all whitespace-pre-wrap max-w-full" style={{ wordBreak: 'break-all' }}>
                        <LabelText text={opt.text} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm text-mono-text/60 mb-1 font-medium">Default Response</p>
                <p className="text-mono-text p-3 bg-mono-primary/5 rounded-lg border border-mono-primary/10 inline-block break-all max-w-full" style={{ wordBreak: 'break-all' }}>
                  <LabelText text={selectedPollForDetails.defaultResponse || 'None'} />
                </p>
              </div>
              <div>
                <p className="text-sm text-mono-text/60 mb-2 font-medium">Settings</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-mono-primary/5 rounded-lg border border-mono-primary/10">
                    <span className="text-xs text-mono-text/60 block">Anonymity</span>
                    <span className="text-mono-text capitalize font-medium">{selectedPollForDetails.anonymityMode}</span>
                  </div>
                  <div className="p-3 bg-mono-primary/5 rounded-lg border border-mono-primary/10">
                    <span className="text-xs text-mono-text/60 block">Show Default</span>
                    <span className="text-mono-text font-medium">{selectedPollForDetails.showDefaultToConsumers ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="p-3 bg-mono-primary/5 rounded-lg border border-mono-primary/10">
                    <span className="text-xs text-mono-text/60 block">Persistent Alert</span>
                    <span className="text-mono-text font-medium">{selectedPollForDetails.isPersistentFinalAlert ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-mono-text/60 mb-2 font-medium">Consumers ({selectedPollForDetails.consumers.length})</p>
                <div className="space-y-1 max-h-40 overflow-y-auto border border-mono-primary/10 rounded-lg p-2 bg-mono-bg">
                  {selectedPollForDetails.consumers.map(email => (
                    <p key={email} className="text-sm text-mono-text px-2 py-1 hover:bg-mono-primary/5 rounded">{email}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-mono-primary/10 bg-mono-bg">
              <button
                onClick={() => setSelectedPollForDetails(null)}
                className="w-full bg-mono-primary text-mono-bg py-3 rounded-xl hover:bg-mono-primary/90 transition-colors font-medium shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
