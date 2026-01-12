import { useState, useEffect, useMemo } from 'react';
import { User, Poll, Response } from '../App';
import { mapResultsToResponses } from '../services/pollService';
import { Clock, CheckCircle, LogOut, AlertTriangle, BarChart3, Settings } from 'lucide-react';
import logo from '../assets/logo.png';
import SignalCard from './SignalCard';
import SignalDetail from './SignalDetail';
import AnalyticsView from './AnalyticsView';

interface ConsumerDashboardProps {
  user: User;
  polls: Poll[];
  responses: Response[];
  onSubmitResponse: (response: Response) => void;
  onSwitchMode: () => void;
  onLogout: () => void;
  successMessage?: string | null;
  onClearMessage?: () => void;
  openPollId?: string | null;
  onPollOpened?: () => void;
}

export default function ConsumerDashboard({
  user,
  polls,
  responses,
  onSubmitResponse,
  onSwitchMode,
  onLogout,
  successMessage,
  onClearMessage,
  openPollId,
  onPollOpened
}: ConsumerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'incomplete' | 'completed' | 'analytics'>('incomplete');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedPollForAnalytics, setSelectedPollForAnalytics] = useState<Poll | null>(null);
  const [analyticsResponses, setAnalyticsResponses] = useState<Response[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleAnalyticsClick = async (poll: Poll) => {
    setSelectedPollForAnalytics(poll);
    setLoadingAnalytics(true);
    setAnalyticsResponses([]); // Clear previous

    try {
      let fetchedResponses: Response[] = [];

      // 1. Try to fetch from Backend if synced
      if (poll.cloudSignalId && (window as any).electron?.backend) {
        console.log('[ConsumerDashboard] Fetching analytics from backend for:', poll.cloudSignalId);
        try {
          const result = await (window as any).electron.backend.getPollResults(poll.cloudSignalId);
          console.log('[ConsumerDashboard] Backend analytics result:', result);

          if (result.success && result.data) {
            // Convert backend DTO to frontend Response[]
            fetchedResponses = mapResultsToResponses(result.data, poll);
          } else {
            console.warn('[ConsumerDashboard] Backend fetch failed or empty, falling back to local:', result.error);
            fetchedResponses = responses.filter(r => r.pollId === poll.id);
          }
        } catch (error) {
          console.error('[ConsumerDashboard] Error fetching from backend:', error);
          fetchedResponses = responses.filter(r => r.pollId === poll.id);
        }
      } else {
        // 2. Use local data if not synced
        console.log('[ConsumerDashboard] Poll not synced, using local data');
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

  // Handle opening poll from notification click
  useEffect(() => {
    console.log('[ConsumerDashboard] openPollId changed:', openPollId);
    if (openPollId) {
      const poll = polls.find(p => p.id === openPollId);
      console.log('[ConsumerDashboard] Found poll:', poll);
      if (poll) {
        console.log('[ConsumerDashboard] Opening poll modal for:', poll.question);
        setSelectedPoll(poll);
        setActiveTab('incomplete'); // Switch to incomplete tab
        if (onPollOpened) {
          onPollOpened(); // Clear the openPollId in parent
        }
      } else {
        console.warn('[ConsumerDashboard] Poll not found with id:', openPollId);
      }
    }
  }, [openPollId, polls, onPollOpened]);

  // Track which alerts have been sent for each poll, including the deadline they were sent for


  // Data and polling logic removed as it's now handled by the Electron main process (SyncManager)
  // and data is passed down via props from App.tsx.

  const userPolls = useMemo(() => {
    return polls.filter(p =>
      p.status !== 'scheduled' && // Exclude scheduled polls - they're not published yet
      p.consumers.some((c: string) => c.toLowerCase() === user.email.toLowerCase())
    );
  }, [polls, user.email]);

  const incompletePolls = useMemo(() => {
    return userPolls.filter(p => {
      const hasResponse = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
      const isExpired = p.status === 'completed' || new Date(p.deadline) < new Date();
      return !hasResponse && !isExpired;
    });
  }, [userPolls, responses, user.email]);

  const completedPolls = useMemo(() => {
    const now = new Date();
    return userPolls.filter(p => {
      const hasResponse = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
      const isExpired = p.status === 'completed' || new Date(p.deadline) < now;
      return hasResponse || isExpired;
    }).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }, [userPolls, responses, user.email]);

  const analyticsPolls = useMemo(() => {
    const now = new Date();
    return [...userPolls].sort((a, b) => {
      const timeA = new Date(a.deadline).getTime();
      const timeB = new Date(b.deadline).getTime();
      const isExpiredA = timeA < now.getTime();
      const isExpiredB = timeB < now.getTime();

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
  }, [userPolls]);

  // Drafts handled by LocalStorage, shared with Global Alert
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDrafts = async () => {
      const savedDrafts = localStorage.getItem('sentinel_drafts');
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    };
    loadDrafts();
  }, []);

  useEffect(() => {
    localStorage.setItem('sentinel_drafts', JSON.stringify(drafts));
  }, [drafts]);

  const handleSaveDraft = (pollId: string, value: string) => {
    setDrafts(prev => ({ ...prev, [pollId]: value }));
  };

  const handleSubmit = async (pollId: string, value: string) => {
    const response: Response = {
      pollId,
      consumerEmail: user.email,
      response: value,
      submittedAt: new Date().toISOString(),
      isDefault: false
    };

    await onSubmitResponse(response);
    setSelectedPoll(null);

    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[pollId];
      return newDrafts;
    });
  };

  const getUserResponse = (pollId: string) => {
    return responses.find(r => r.pollId === pollId && r.consumerEmail === user.email);
  };



  return (
    <div className="min-h-screen bg-mono-bg">

      {/* Header */}
      <header className="bg-mono-primary border-b border-mono-primary sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-11 h-11 bg-mono-accent rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img src={logo} alt="Sentinel Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-mono-bg">Sentinel</h1>
                <p className="text-sm text-mono-bg/70">Consumer Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {incompletePolls.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-mono-accent/20 border border-mono-accent/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-mono-accent" />
                  <span className="text-sm text-mono-bg">
                    {incompletePolls.length} pending
                  </span>
                </div>
              )}

              <div className="hidden sm:block text-right mr-4 px-4 py-2 bg-mono-bg/10 backdrop-blur rounded-xl border border-mono-bg/20">
                <p className="text-sm text-mono-bg">{user.name}</p>
                <p className="text-xs text-mono-bg/70">{user.email}</p>
              </div>

              {user.isPublisher && (
                <button
                  onClick={onSwitchMode}
                  className="flex items-center gap-2 px-4 py-2.5 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg"
                >
                  <span className="hidden sm:inline">Switch to Publisher</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2.5 text-mono-bg/70 hover:text-mono-bg hover:bg-mono-bg/10 rounded-xl transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {showSettings && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSettings(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-mono-primary rounded-xl shadow-xl border border-mono-bg/10 py-1 z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowSettings(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-mono-bg hover:bg-mono-accent/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message Banner */}
      {successMessage && (
        <div className="bg-green-500 text-white px-4 py-3 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
          {onClearMessage && (
            <button
              onClick={onClearMessage}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close message"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-mono-primary/5 border-b border-mono-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('incomplete')}
              className={`flex items-center gap-2 px-6 py-4 border-b-3 transition-all rounded-t-xl ${activeTab === 'incomplete'
                ? 'border-b-mono-accent text-mono-primary bg-mono-accent/10'
                : 'border-transparent text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/5'
                }`}
            >
              <Clock className="w-5 h-5" />
              <span className="hidden sm:inline">Incomplete</span>
              {incompletePolls.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${activeTab === 'incomplete'
                  ? 'bg-mono-accent/30 text-mono-primary'
                  : 'bg-mono-accent/20 text-mono-primary'
                  }`}>
                  {incompletePolls.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-6 py-4 border-b-3 transition-all rounded-t-xl ${activeTab === 'completed'
                ? 'border-b-mono-accent text-mono-primary bg-mono-accent/10'
                : 'border-transparent text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/5'
                }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Completed</span>
              {completedPolls.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${activeTab === 'completed'
                  ? 'bg-mono-accent/30 text-mono-primary'
                  : 'bg-mono-primary/20 text-mono-primary'
                  }`}>
                  {completedPolls.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-6 py-4 border-b-3 transition-all rounded-t-xl ${activeTab === 'analytics'
                ? 'border-b-mono-accent text-mono-primary bg-mono-accent/10'
                : 'border-transparent text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/5'
                }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'incomplete' && (
          <div>
            {incompletePolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-mono-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-mono-accent" />
                </div>
                <h3 className="text-mono-text mb-2">All Caught Up!</h3>
                <p className="text-mono-text/60">
                  You don't have any pending signals at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-mono-text mb-2">Pending Signals</h2>
                  <p className="text-mono-text/60">
                    Signals are sorted by nearest deadline first
                  </p>
                </div>
                {incompletePolls.map(poll => (
                  <SignalCard
                    key={poll.id}
                    poll={poll}
                    hasDraft={!!drafts[poll.id]}
                    onClick={() => setSelectedPoll(poll)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div>
            {completedPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-mono-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-mono-primary/40" />
                </div>
                <h3 className="text-mono-text mb-2">No Submissions Yet</h3>
                <p className="text-mono-text/60">
                  Your completed signals will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-mono-text mb-2">Your Submissions</h2>
                  <p className="text-mono-text/60">
                    View your completed signals and responses
                  </p>
                </div>
                {completedPolls.map(poll => {
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
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div className="mb-6">
              <h2 className="text-mono-text mb-2">Poll Analytics</h2>
              <p className="text-mono-text/60">
                View response analytics for polls you were assigned to
              </p>
            </div>
            {userPolls.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-mono-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-10 h-10 text-mono-primary/40" />
                </div>
                <h3 className="text-mono-text mb-2">No Polls Available</h3>
                <p className="text-mono-text/60">
                  You haven't been assigned to any polls yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsPolls.map(poll => {
                  const totalConsumers = poll.consumers.length;

                  return (
                    <div
                      key={poll.id}
                      className="bg-mono-bg border border-mono-primary/10 rounded-xl shadow-sm hover:shadow-md transition-all p-5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-mono-text text-lg font-medium mb-2">{poll.question}</h3>
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
                        onClick={() => handleAnalyticsClick(poll)}
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
            )}
          </div>
        )}
      </main>

      {/* Signal Detail Modal */}
      {selectedPoll && (
        <SignalDetail
          poll={selectedPoll}
          draft={drafts[selectedPoll.id]}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onClose={() => {
            setSelectedPoll(null);
          }}
          isPersistentContext={false}
          userResponse={responses.find(r => r.pollId === selectedPoll.id && r.consumerEmail === user.email)}
        />
      )}

      {/* Analytics Modal */}
      {selectedPollForAnalytics && !loadingAnalytics && (
        <AnalyticsView
          poll={selectedPollForAnalytics}
          responses={analyticsResponses}
          onClose={() => {
            setSelectedPollForAnalytics(null);
            setAnalyticsResponses([]);
          }}
        />
      )}


    </div>
  );
}
