/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * 
 * The functionality has been migrated to the new Ribbit layout:
 * - Use RibbitLayout from '@/components/layout' as the main shell
 * - Navigate to 'inbox' page via sidebar for incomplete signals
 * - Completed and Analytics tabs will be added as sub-tabs in Phase 2
 * 
 * Individual content components (IncompletePolls, CompletedPolls, AnalyticsPolls)
 * are still in use and are rendered within the new layout.
 */

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { User, Poll, Response } from '../types';
import { mapResultsToResponses } from '../services/pollService';
import { Clock, CheckCircle, BarChart3 } from 'lucide-react';

import DashboardHeader from './dashboard/DashboardHeader';
import IncompletePolls from './dashboard/IncompletePolls';
import CompletedPolls from './dashboard/CompletedPolls';
import AnalyticsPolls from './dashboard/AnalyticsPolls';

import SignalDetail from './SignalDetail';
const AnalyticsView = lazy(() => import('./AnalyticsView'));

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

/** @deprecated Use RibbitLayout with 'inbox' page instead */
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

  // drafts state
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

  const calculatePolls = () => {
    const userPolls = polls.filter(p =>
      p.status !== 'scheduled' &&
      p.consumers.some((c: string) => c.toLowerCase() === user.email.toLowerCase())
    );

    const now = new Date();

    const incomplete = userPolls.filter(p => {
      const hasResponse = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
      const isExpired = p.status === 'completed' || new Date(p.deadline) < now;
      return !hasResponse && !isExpired;
    });

    const completed = userPolls.filter(p => {
      const hasResponse = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
      const isExpired = p.status === 'completed' || new Date(p.deadline) < now;
      return hasResponse || isExpired;
    }).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

    const analytics = [...userPolls].sort((a, b) => {
      const timeA = new Date(a.deadline).getTime();
      const timeB = new Date(b.deadline).getTime();
      const isExpiredA = timeA < now.getTime();
      const isExpiredB = timeB < now.getTime();

      if (isExpiredA !== isExpiredB) {
        return isExpiredA ? 1 : -1;
      }
      if (isExpiredA) {
        return timeB - timeA;
      }
      return timeA - timeB;
    });

    return { userPolls, incomplete, completed, analytics };
  };

  const { incomplete, completed, analytics } = useMemo(calculatePolls, [polls, responses, user.email]);

  const handleAnalyticsClick = async (poll: Poll) => {
    setSelectedPollForAnalytics(poll);
    setLoadingAnalytics(true);
    setAnalyticsResponses([]);

    try {
      let fetchedResponses: Response[] = [];

      if (poll.cloudSignalId && window.electron?.backend) {
        console.log('[ConsumerDashboard] Fetching analytics from backend for:', poll.cloudSignalId);
        try {
          const result = await window.electron.backend.getPollResults(poll.cloudSignalId);
          if (result.success && result.data) {
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

  useEffect(() => {
    if (openPollId) {
      const poll = polls.find(p => p.id === openPollId);
      if (poll) {
        setSelectedPoll(poll);
        setActiveTab('incomplete');
        if (onPollOpened) onPollOpened();
      }
    }
  }, [openPollId, polls, onPollOpened]);

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

  return (
    <div className="min-h-screen bg-mono-bg">
      <DashboardHeader
        user={user}
        incompleteCount={incomplete.length}
        onSwitchMode={onSwitchMode}
        onLogout={onLogout}
      />

      {successMessage && (
        <div className="bg-green-500 text-white px-4 py-3 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
          {onClearMessage && (
            <button onClick={onClearMessage} className="text-white/80 hover:text-white transition-colors" aria-label="Close message">
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
              {incomplete.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${activeTab === 'incomplete'
                  ? 'bg-mono-accent/30 text-mono-primary'
                  : 'bg-mono-accent/20 text-mono-primary'
                  }`}>
                  {incomplete.length}
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
              {completed.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${activeTab === 'completed'
                  ? 'bg-mono-accent/30 text-mono-primary'
                  : 'bg-mono-primary/20 text-mono-primary'
                  }`}>
                  {completed.length}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'incomplete' && (
          <IncompletePolls
            polls={incomplete}
            drafts={drafts}
            onSelectPoll={setSelectedPoll}
          />
        )}

        {activeTab === 'completed' && (
          <CompletedPolls
            polls={completed}
            responses={responses}
            user={user}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPolls
            polls={analytics}
            selectedPollForAnalytics={selectedPollForAnalytics}
            loadingAnalytics={loadingAnalytics}
            onAnalyticsClick={handleAnalyticsClick}
          />
        )}
      </main>

      {/* Modals */}
      {selectedPoll && (
        <SignalDetail
          poll={selectedPoll}
          draft={drafts[selectedPoll.id]}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onClose={() => setSelectedPoll(null)}
          isPersistentContext={false}
          userResponse={responses.find(r => r.pollId === selectedPoll.id && r.consumerEmail === user.email)}
        />
      )}

      {selectedPollForAnalytics && !loadingAnalytics && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        }>
          <AnalyticsView
            poll={selectedPollForAnalytics}
            responses={analyticsResponses}
            onClose={() => {
              setSelectedPollForAnalytics(null);
              setAnalyticsResponses([]);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
