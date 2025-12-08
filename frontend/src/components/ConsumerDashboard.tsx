/// <reference path="../types/electron.d.ts" />
import { useState, useEffect } from 'react';
import { User, Poll, Response } from '../App';
import { Clock, CheckCircle, LogOut, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import logo from '../assets/logo.png';
import SignalCard from './SignalCard';
import SignalDetail from './SignalDetail';
import PersistentAlert from './PersistentAlert';

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
  const [activeTab, setActiveTab] = useState<'incomplete' | 'completed'>('incomplete');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [showPersistentAlert, setShowPersistentAlert] = useState(false);
  const [persistentAlertPoll, setPersistentAlertPoll] = useState<Poll | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Get polls assigned to this user
  const userPolls = polls.filter(p => p.consumers.includes(user.email));

  // Get incomplete polls (active polls where user hasn't responded)
  const incompletePolls = userPolls.filter(p => {
    const hasResponded = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
    return !hasResponded && p.status === 'active';
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Get completed polls
  const completedPolls = userPolls.filter(p => {
    return responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
  }).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

  // Track which alerts have been sent for each poll
  const [sentAlerts, setSentAlerts] = useState<Record<string, number[]>>({});

  // Check for alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      incompletePolls.forEach(poll => {
        const deadline = new Date(poll.deadline);
        const minutesUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));

        // Define alert thresholds (60, 30, 15, 1 minute)
        const alertThresholds = [60, 30, 15, 1];

        const pollSentAlerts = sentAlerts[poll.id] || [];

        alertThresholds.forEach(threshold => {
          // Only send each alert once
          if (pollSentAlerts.includes(threshold)) return;

          // Check if we're within 15 seconds of the alert time
          const isAlertTime = minutesUntilDeadline <= threshold && minutesUntilDeadline > (threshold - 0.25);

          if (isAlertTime) {
            // Mark this alert as sent
            setSentAlerts(prev => ({
              ...prev,
              [poll.id]: [...(prev[poll.id] || []), threshold]
            }));

            // Trigger system notification
            const notification = new Notification(`Sentinel Alert: ${poll.publisherName}`, {
              body: `${threshold} min left: ${poll.question}`,
              silent: false
            });

            notification.onclick = () => {
              window.focus();
              if ((window as any).electron) {
                (window as any).electron.ipcRenderer.send('show-window');
              }
              setSelectedPoll(poll);
            };

            // Only 1-minute alert can be persistent
            if (threshold === 1 && poll.isPersistentFinalAlert) {
              if ((window as any).electron) {
                (window as any).electron.ipcRenderer.send('set-persistent-alert-active', true);
              }
              setPersistentAlertPoll(poll);
              setShowPersistentAlert(true);
            }
          }
        });
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [incompletePolls, showPersistentAlert, sentAlerts]);

  // Load drafts
  useEffect(() => {
    const loadDrafts = async () => {
      if (window.electron?.store) {
        const savedDrafts = await window.electron.store.get('sentinel_drafts');
        if (savedDrafts) setDrafts(savedDrafts);
      } else {
        const savedDrafts = localStorage.getItem('sentinel_drafts');
        if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
      }
    };
    loadDrafts();
  }, []);

  // Save drafts
  useEffect(() => {
    if (window.electron?.store) {
      window.electron.store.set('sentinel_drafts', drafts);
    } else {
      localStorage.setItem('sentinel_drafts', JSON.stringify(drafts));
    }
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
      </main>

      {/* Signal Detail Modal */}
      {selectedPoll && (
        <SignalDetail
          poll={selectedPoll}
          draft={drafts[selectedPoll.id]}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onClose={() => setSelectedPoll(null)}
        />
      )}
    </div>
  );
}
