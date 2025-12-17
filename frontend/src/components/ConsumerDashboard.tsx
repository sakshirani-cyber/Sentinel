/// <reference path="../types/electron.d.ts" />
import { useState, useEffect } from 'react';
import { User, Poll, Response } from '../App';
import { Clock, CheckCircle, LogOut, ArrowRightLeft, AlertTriangle, BarChart3 } from 'lucide-react';
import logo from '../assets/logo.png';
import SignalCard from './SignalCard';
import SignalDetail from './SignalDetail';
import PersistentAlert from './PersistentAlert';
import AnalyticsView from './AnalyticsView';

interface ConsumerDashboardProps {
  user: User;
  polls: Poll[];
  responses: Response[];
  onSubmitResponse: (response: Response) => void;
  onSwitchMode: () => void;
  onLogout: () => void;
}

export default function ConsumerDashboard({
  user,
  polls,
  responses,
  onSubmitResponse,
  onSwitchMode,
  onLogout
}: ConsumerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'incomplete' | 'completed' | 'analytics'>('incomplete');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [showPersistentAlert, setShowPersistentAlert] = useState(false);
  const [persistentAlertPoll, setPersistentAlertPoll] = useState<Poll | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selectedPollForAnalytics, setSelectedPollForAnalytics] = useState<Poll | null>(null);

  // Get polls assigned to this user
  const userPolls = polls.filter(p => p.consumers.includes(user.email));

  // Get incomplete polls (active polls where user hasn't responded AND deadline hasn't passed)
  const incompletePolls = userPolls.filter(p => {
    const hasResponded = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
    const isExpired = new Date(p.deadline) < new Date();
    return !hasResponded && p.status === 'active' && !isExpired;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Get completed polls
  const completedPolls = userPolls.filter(p => {
    return responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
  }).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());


  // Track which alerts have been sent for each poll, including the deadline they were sent for
  const [sentAlerts, setSentAlerts] = useState<Record<string, { deadline: string, alerts: number[] }>>({});

  // Track which polls have been notified about
  const [notifiedPolls, setNotifiedPolls] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sentinel_notified_polls');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Notify when new polls are assigned to the user
  useEffect(() => {
    if (Notification.permission !== 'granted') return;

    userPolls.forEach(poll => {
      // Only notify for incomplete polls
      const hasResponded = responses.some(r => r.pollId === poll.id && r.consumerEmail === user.email);
      if (hasResponded || notifiedPolls.has(poll.id)) return;

      // Mark as notified
      setNotifiedPolls(prev => {
        const newSet = new Set(prev);
        newSet.add(poll.id);
        localStorage.setItem('sentinel_notified_polls', JSON.stringify([...newSet]));
        return newSet;
      });

      // Send notification
      console.log('[Notification] New poll assigned:', poll.question);
      const notification = new Notification(`New Poll from ${poll.publisherName}`, {
        body: poll.question,
        silent: false,
        icon: '/logo.png'
      });

      notification.onclick = () => {
        if ((window as any).electron) {
          (window as any).electron.ipcRenderer.send('restore-window');
        }
        window.focus();
        setSelectedPoll(poll);
      };
    });
  }, [userPolls, notifiedPolls, responses, user.email]);

  // Track which polls have been notified about updates
  const [notifiedUpdates, setNotifiedUpdates] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sentinel_notified_updates');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('[Notifications] Permission:', permission);
      });
    } else {
      console.log('[Notifications] Current permission:', Notification.permission);
    }
  }, []);

  // Notify when polls are updated
  useEffect(() => {
    userPolls.forEach(poll => {
      // Only notify if edited and not yet notified
      // Use updatedAt to track unique edits if available, otherwise fallback to ID
      const notificationKey = poll.updatedAt ? `${poll.id}_${poll.updatedAt}` : poll.id;

      if (poll.isEdited && !notifiedUpdates.has(notificationKey)) {

        // Mark as notified
        setNotifiedUpdates(prev => {
          const newSet = new Set(prev);
          newSet.add(notificationKey);
          localStorage.setItem('sentinel_notified_updates', JSON.stringify([...newSet]));
          return newSet;
        });

        // Send notification
        const notification = new Notification(`Poll Updated: ${poll.publisherName}`, {
          body: `The poll "${poll.question}" has been updated. Please check the new details.`,
          silent: false,
          icon: '/logo.png'
        });

        notification.onclick = () => {
          if ((window as any).electron) {
            (window as any).electron.ipcRenderer.send('restore-window');
          }
          window.focus();
          setSelectedPoll(poll);
        };
      }
    });
  }, [userPolls, notifiedUpdates]);

  // Check for alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      console.log('[Debug] Checking alerts at', now.toLocaleTimeString());
      console.log('[Debug] Incomplete polls count:', incompletePolls.length);

      incompletePolls.forEach(poll => {
        const deadline = new Date(poll.deadline);
        const minutesUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));

        console.log(`[Debug] Poll "${poll.question}": ${minutesUntilDeadline} min left. Deadline: ${deadline.toLocaleTimeString()}`);

        // Define alert thresholds (60, 30, 15, 1 minute)
        const alertThresholds = [60, 30, 15, 1];

        // Get sent alerts for this poll
        const pollAlertData = sentAlerts[poll.id];

        // Check if deadline has changed since last alert
        let currentSentAlerts: number[] = [];
        if (pollAlertData && pollAlertData.deadline === poll.deadline) {
          currentSentAlerts = pollAlertData.alerts;
        }

        console.log(`[Debug] Poll "${poll.question}" sent alerts:`, currentSentAlerts);

        alertThresholds.forEach(threshold => {
          // Only send each alert once
          if (currentSentAlerts.includes(threshold)) return;

          // Check if we're within the alert window
          // Triggers when minutesUntilDeadline equals the threshold (e.g., 1 means 1m0s to 1m59s)
          // For 1-minute alert, trigger if <= 1 minute left (covers 0m 0s to 1m 59s case) to ensure it's not missed
          const isAlertTime = threshold === 1
            ? minutesUntilDeadline <= 1 && minutesUntilDeadline >= 0
            : minutesUntilDeadline === threshold;

          if (isAlertTime) {
            // Double-check: Don't send notification if poll is expired or user already responded
            const isPollExpired = new Date(poll.deadline) < new Date();
            const hasUserResponded = responses.some(r => r.pollId === poll.id && r.consumerEmail === user.email);

            if (isPollExpired) {
              console.log(`[Alert] Skipping notification - poll expired: ${poll.question}`);
              return;
            }

            if (hasUserResponded) {
              console.log(`[Alert] Skipping notification - user already responded: ${poll.question}`);
              return;
            }

            console.log(`[Alert] Triggering ${threshold}-minute alert for poll: ${poll.question}`);
            console.log(`[Alert] Time until deadline: ${minutesUntilDeadline} minutes range`);

            // Mark this alert as sent, updating the deadline if needed
            setSentAlerts(prev => {
              const existing = prev[poll.id];
              // If deadline changed, start fresh. Otherwise append to existing.
              const alerts = (existing && existing.deadline === poll.deadline)
                ? [...existing.alerts, threshold]
                : [threshold];

              return {
                ...prev,
                [poll.id]: {
                  deadline: poll.deadline,
                  alerts
                }
              };
            });

            // Check notification permission
            if (Notification.permission !== 'granted') {
              console.warn('[Alert] Notification permission not granted');
              return;
            }

            // Trigger system notification
            console.log(`[Notification] Sending ${threshold}-min alert`);
            const notification = new Notification(`Sentinel Alert: ${poll.publisherName}`, {
              body: `${threshold} min left: ${poll.question}`,
              silent: false,
              icon: '/logo.png' // Add app logo to notification
            });

            notification.onclick = () => {
              // Restore and focus the window
              if ((window as any).electron) {
                (window as any).electron.ipcRenderer.send('restore-window');
              }
              window.focus();
              setSelectedPoll(poll);
            };

            // Only 1-minute alert can be persistent
            if (threshold === 1 && poll.isPersistentFinalAlert) {
              // Check device status before showing persistent alert
              if ((window as any).electron) {
                (window as any).electron.getDeviceStatus().then((status: string) => {
                  // Check if poll is expired before taking action
                  const isExpired = new Date(poll.deadline) < new Date();

                  // Only auto-submit if device is LOCKED or SLEEPING (not idle!)
                  if ((status === 'locked' || status === 'sleep') && !isExpired) {
                    // Device is truly unavailable - auto-submit default response
                    console.log(`[Sentinel] Auto-submitting default response due to device status: ${status}`);

                    const response: Response = {
                      pollId: poll.id,
                      consumerEmail: user.email,
                      response: poll.defaultResponse || '',
                      submittedAt: new Date().toISOString(),
                      isDefault: true,
                      skipReason: `Auto-submitted: Device was ${status}`
                    };

                    onSubmitResponse(response);

                    // Clear draft if exists
                    setDrafts(prev => {
                      const newDrafts = { ...prev };
                      delete newDrafts[poll.id];
                      return newDrafts;
                    });
                  } else if (isExpired) {
                    // Poll is expired - dismiss persistent alert if shown
                    console.log(`[Sentinel] Poll expired - dismissing persistent alert`);
                    setShowPersistentAlert(false);
                    setPersistentAlertPoll(null);
                  } else {
                    // Device is active OR idle - show persistent alert for both
                    console.log(`[Sentinel] Showing persistent alert (device status: ${status})`);
                    (window as any).electron.ipcRenderer.send('set-persistent-alert-active', true);
                    setPersistentAlertPoll(poll);
                    setShowPersistentAlert(true);
                  }
                });
              } else {
                // Fallback for non-electron env (dev)
                setPersistentAlertPoll(poll);
                setShowPersistentAlert(true);
              }
            }
          }
        });
      });
    }, 1000); // Check every 1 second

    return () => clearInterval(interval);
  }, [incompletePolls, showPersistentAlert, sentAlerts]);

  // Auto-dismiss persistent alert when deadline passes
  useEffect(() => {
    if (!showPersistentAlert || !persistentAlertPoll) return;

    const interval = setInterval(() => {
      const now = new Date();
      const deadline = new Date(persistentAlertPoll.deadline);

      if (now >= deadline) {
        console.log('[Sentinel] Deadline passed - auto-dismissing persistent alert');
        setShowPersistentAlert(false);
        setPersistentAlertPoll(null);

        // Unlock window
        if ((window as any).electron) {
          (window as any).electron.ipcRenderer.send('set-persistent-alert-active', false);
          (window as any).electron.ipcRenderer.send('set-always-on-top', false);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [showPersistentAlert, persistentAlertPoll]);


  // Load drafts
  useEffect(() => {
    const loadDrafts = async () => {
      const savedDrafts = localStorage.getItem('sentinel_drafts');
      if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    };
    loadDrafts();
  }, []);

  // Save drafts
  useEffect(() => {
    localStorage.setItem('sentinel_drafts', JSON.stringify(drafts));
  }, [drafts]);

  const handleSaveDraft = (pollId: string, value: string) => {
    setDrafts(prev => ({ ...prev, [pollId]: value }));
  };

  const handleSubmit = (pollId: string, value: string) => {
    const response: Response = {
      pollId,
      consumerEmail: user.email,
      response: value,
      submittedAt: new Date().toISOString(),
      isDefault: false
    };
    onSubmitResponse(response);

    // Unlock window when submitting from persistent alert
    if ((window as any).electron) {
      (window as any).electron.ipcRenderer.send('set-persistent-alert-active', false);
      (window as any).electron.ipcRenderer.send('set-always-on-top', false);
    }

    // Clear draft
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[pollId];
      return newDrafts;
    });

    // Close persistent alert if it was open
    setShowPersistentAlert(false);
    setPersistentAlertPoll(null);
    setSelectedPoll(null);
  };

  const handleSkip = (pollId: string, reason: string) => {
    const poll = polls.find(p => p.id === pollId);
    const response: Response = {
      pollId,
      consumerEmail: user.email,
      response: poll?.defaultResponse || '',
      submittedAt: new Date().toISOString(),
      isDefault: true,
      skipReason: reason
    };
    onSubmitResponse(response);

    // Unlock window when alert is dismissed
    if ((window as any).electron) {
      (window as any).electron.ipcRenderer.send('set-persistent-alert-active', false);
      (window as any).electron.ipcRenderer.send('set-always-on-top', false);
    }

    setShowPersistentAlert(false);
    setPersistentAlertPoll(null);
  };

  const getUserResponse = (pollId: string) => {
    return responses.find(r => r.pollId === pollId && r.consumerEmail === user.email);
  };

  return (
    <div className="min-h-screen bg-mono-bg">
      {/* Persistent Alert Modal */}
      {showPersistentAlert && persistentAlertPoll && (
        <PersistentAlert
          poll={persistentAlertPoll}
          onSkip={handleSkip}
          onFill={() => {
            setSelectedPoll(persistentAlertPoll);
            setShowPersistentAlert(false);
          }}
        />
      )}

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
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Publisher</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="p-2.5 text-mono-bg/70 hover:text-mono-bg hover:bg-mono-bg/10 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
                {userPolls.map(poll => {
                  const pollResponses = responses.filter(r => r.pollId === poll.id);
                  const responseCount = pollResponses.length;
                  const totalConsumers = poll.consumers.length;
                  const responseRate = totalConsumers > 0 ? (responseCount / totalConsumers) * 100 : 0;

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
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" />
                              Status: {poll.status}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2 text-mono-text/60">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{totalConsumers} consumers</span>
                        </div>
                        <div className="flex items-center gap-2 text-mono-primary font-medium">
                          <BarChart3 className="w-4 h-4" />
                          <span>{responseCount} responses</span>
                        </div>
                        <div className="px-2 py-1 bg-mono-accent/20 text-mono-primary rounded text-xs font-medium">
                          {responseRate.toFixed(1)}% response rate
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedPollForAnalytics(poll)}
                        className="flex items-center gap-2 px-4 py-2 bg-mono-primary text-mono-bg rounded-lg hover:bg-mono-primary/90 transition-colors text-sm font-medium"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Analytics
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
            // If we're in persistent alert context, go back to persistent alert instead of fully closing
            if (showPersistentAlert && selectedPoll?.isPersistentFinalAlert) {
              setSelectedPoll(null);
              // Don't setShowPersistentAlert(false) - stay in persistent alert mode
            } else {
              setSelectedPoll(null);
            }
          }}
          isPersistentContext={showPersistentAlert && selectedPoll?.isPersistentFinalAlert}
        />
      )}

      {/* Analytics Modal */}
      {selectedPollForAnalytics && (
        <AnalyticsView
          poll={selectedPollForAnalytics}
          responses={responses.filter(r => r.pollId === selectedPollForAnalytics.id)}
          onClose={() => setSelectedPollForAnalytics(null)}
        />
      )}

      {/* Persistent Alert */}
      {showPersistentAlert && persistentAlertPoll && !selectedPoll && (
        <PersistentAlert
          poll={persistentAlertPoll}
          onSkip={handleSkip}
          onFill={() => {
            setSelectedPoll(persistentAlertPoll);
            // Keep showPersistentAlert true so we can return to it
          }}
        />
      )}
    </div>
  );
}
