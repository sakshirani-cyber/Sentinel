import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import PublisherDashboard from './components/PublisherDashboard';
import ConsumerDashboard from './components/ConsumerDashboard';
import GlobalAlertManager from './components/GlobalAlertManager';
import LabelManager from './components/LabelManager';

export interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
  isPublisher: boolean;
}

export interface Option {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  question: string;
  options: Option[];
  publisherEmail: string;
  publisherName: string;
  deadline: string;
  status: 'active' | 'completed' | 'scheduled';
  scheduledFor?: string;
  consumers: string[];
  defaultResponse?: string;
  showDefaultToConsumers: boolean;
  anonymityMode: 'anonymous' | 'record';
  isPersistentAlert: boolean;
  alertBeforeMinutes: number;
  publishedAt: string;
  isPersistentFinalAlert?: boolean;
  isEdited?: boolean;
  updatedAt?: string;
  cloudSignalId?: number;
  syncStatus?: 'synced' | 'pending' | 'error';
  labels?: string[];
}

import PersistentAlertSecondary from './components/PersistentAlertSecondary';

export interface Response {
  pollId: string;
  consumerEmail: string;
  response: string;
  submittedAt: string;
  isDefault: boolean;
  skipReason?: string;
}

function App() {
  const isSecondary = new URLSearchParams(window.location.search).get('isSecondary') === 'true';

  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  // If this is a secondary monitor window, render the lock-out view immediately
  if (isSecondary) {
    return <PersistentAlertSecondary />;
  }
  // We need a view mode state to allow publishers to switch to consumer view
  const [viewMode, setViewMode] = useState<'consumer' | 'publisher' | 'labels'>('consumer');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openPollId, setOpenPollId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if ((window as any).electron) {
          console.log('[App] Fetching data from local DB...');
          const loadedPolls = await (window as any).electron.db.getPolls();
          const loadedResponses = await (window as any).electron.db.getResponses();
          console.log(`[App] Received ${loadedPolls.length} polls and ${loadedResponses.length} responses from local DB.`);
          setPolls(loadedPolls);
          setResponses(loadedResponses);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up polling for updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setViewMode(user.isPublisher ? 'publisher' : 'consumer');
    }
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    setLoginError(null);
    setLoginSuccess(null);

    try {
      if ((window as any).electron?.backend) {
        console.log('[Frontend] Attempting login via backend:', email);
        const result = await (window as any).electron.backend.login(email, password);

        if (result.success) {
          console.log('[Frontend] Login successful, role:', result.data);

          setLoginSuccess('Login successful! Loading dashboard...');
          await new Promise(resolve => setTimeout(resolve, 500));

          const role = result.data;
          const isPublisher = role === 'PUBLISHER';

          const userData: User = {
            name: email.split('@')[0],
            email: email,
            role: isPublisher ? 'admin' : 'user',
            isPublisher: isPublisher
          };
          setUser(userData);
        } else {
          console.error('[Frontend] Login failed:', result.error);
          setLoginError(result.error || 'Login failed');
        }
      } else {
        console.warn('[Frontend] Backend API not available, using mock login');
        const isPublisher =
          email.toLowerCase().startsWith('hr') ||
          email.toLowerCase().includes('admin') ||
          email.toLowerCase().startsWith('publisher');
        const userData: User = {
          name: email.split('@')[0],
          email: email,
          role: isPublisher ? 'admin' : 'user',
          isPublisher: isPublisher
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('[Frontend] Login error:', error);
      setLoginError('An error occurred during login');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginSuccess(null);
    setLoginError(null);
  };

  const handleCreatePoll = async (newPoll: Poll) => {
    console.log(`[App] [${new Date().toLocaleTimeString()}] 📥 handleCreatePoll called with poll:`, {
      id: newPoll.id,
      question: newPoll.question,
      consumersCount: newPoll.consumers.length
    });

    try {
      // Always save to local DB
      if ((window as any).electron) {
        console.log(`[App] [${new Date().toLocaleTimeString()}] 💾 Calling electron.backend.createPoll (IPC: backend-create-poll)...`);
        const result = await (window as any).electron.backend.createPoll(newPoll);

        console.log(`[App] [${new Date().toLocaleTimeString()}] 📬 Received result from IPC:`, result);

        if (result.success) {
          console.log(`[App] [${new Date().toLocaleTimeString()}] ✅ Poll saved to local DB successfully`);
          setPolls(prev => [...prev, newPoll]);

          // Redirect to publisher view with success message
          setViewMode('publisher');
          setSuccessMessage('Poll published successfully!');

          // Clear message after 5 seconds
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          console.error('[App] ❌ Failed to create poll locally:', result.error);
          alert('Failed to create poll: ' + result.error);
        }
      } else {
        console.warn('[App] ⚠️ Electron API not available');
      }
    } catch (error) {
      console.error('[App] ❌ Error creating poll:', error);
      alert('Error creating poll: ' + (error as Error).message);
    }
  };

  const handleUpdatePoll = async (pollId: string, updates: Partial<Poll>, republish: boolean) => {
    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) throw new Error('Poll not found');

      console.log('[App] handleUpdatePoll (local-first) called:', { pollId, updates, republish });

      // Always update local DB
      if ((window as any).electron) {
        const result = await (window as any).electron.ipcRenderer.invoke('db-update-poll', { pollId, updates, republish });
        if (result.success) {
          setPolls(prev => prev.map(p => p.id === pollId ? { ...p, ...updates } : p));
          // If republished, clear local responses for this poll
          if (republish) {
            setResponses(prev => prev.filter(r => r.pollId !== pollId));
          }
        } else {
          console.error('Failed to update poll:', result.error);
          alert('Failed to update poll: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error updating poll:', error);
      alert('Error updating poll: ' + (error as Error).message);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) {
        console.error('Poll not found:', pollId);
        return;
      }

      // Always delete from local state
      setPolls(prev => prev.filter(p => p.id !== pollId));
      console.log('[Frontend] Poll deleted from local state:', pollId);

      // Delete from local DB via Electron IPC
      if ((window as any).electron) {
        try {
          console.log('[Frontend] Initiating DB deletion for:', pollId);
          const result = await (window as any).electron.db.deletePoll(pollId);
          if (result.success) {
            console.log('[Frontend] Poll deleted from local DB successfully. Changes:', result.changes);
            if (result.changes === 0) {
              console.warn('[Frontend] Deletion called but 0 rows affected in DB. Poll might have been already deleted.');
            }
          } else {
            console.error('[Frontend] Failed to delete poll from local DB:', result.error);
            alert(`Failed to delete poll from local database: ${result.error}`);
            // Re-fetch to restore state if deletion failed
            const latestPolls = await (window as any).electron.db.getPolls();
            setPolls(latestPolls);
          }
        } catch (error) {
          console.error('[Frontend] IPC Error deleting from local DB:', error);
        }
      }

    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Error deleting poll: ' + (error as Error).message);
    }
  };

  const handlePublishNow = async (poll: Poll) => {
    try {
      console.log(`[App] 🚀 Publishing scheduled poll now: ${poll.id}`);
      const updatedPoll = { ...poll, status: 'active' as const, scheduledFor: undefined, publishedAt: new Date().toISOString() };

      // Treat it as a new creation to trigger the full sync flow (which now won't be skipped since status is active)
      if ((window as any).electron) {
        const result = await (window as any).electron.backend.createPoll(updatedPoll);
        if (result.success) {
          console.log('[App] ✅ Scheduled poll published successfully');
          setPolls(prev => prev.map(p => p.id === poll.id ? updatedPoll : p));
        } else {
          console.error('[App] ❌ Failed to publish scheduled poll:', result.error);
          alert('Failed to publish poll: ' + result.error);
        }
      }
    } catch (error) {
      console.error('[App] Error publishing poll:', error);
      alert('Error publishing poll');
    }
  };



  const handleSubmitResponse = async (response: Response) => {
    try {
      // Find poll by ID or by cloudSignalId (for backend polls)
      let poll = polls.find(p => p.id === response.pollId);

      // If not found, try to find by cloudSignalId (backend polls use signalId.toString() as ID)
      if (!poll) {
        poll = polls.find(p => p.cloudSignalId?.toString() === response.pollId);
      }

      if ((window as any).electron?.backend) {
        console.log('[Frontend] Calling local-first submitVote:', response.pollId);

        // Use the simplified IPC handler which writes to local DB
        const result = await (window as any).electron.backend.submitVote(
          poll?.id || response.pollId,
          poll?.cloudSignalId,
          response.consumerEmail,
          response.response,
          response.isDefault ? response.response : undefined,
          response.isDefault ? response.skipReason : undefined
        );

        if (result.success) {
          setResponses(prev => [...prev, response]);
        } else {
          // Show user-friendly error message
          alert(result.error || 'Failed to submit response');
          throw new Error(result.error || 'Failed to submit response');
        }
      } else {
        // No electron, just add to state
        setResponses(prev => [...prev, response]);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} error={loginError} success={loginSuccess} />;
  }

  if (viewMode === 'publisher' && user.isPublisher) {
    return (
      <>
        <GlobalAlertManager
          user={user}
          polls={polls}
          responses={responses}
          onSubmitResponse={handleSubmitResponse}
          onOpenPoll={(pollId) => {
            console.log('[App Publisher Mode] onOpenPoll called with pollId:', pollId);
            setOpenPollId(pollId);
            setViewMode('consumer'); // Switch to consumer view to show the poll
          }}
        />
        <PublisherDashboard
          user={user}
          polls={polls}
          responses={responses}
          onCreatePoll={handleCreatePoll}
          onDeletePoll={handleDeletePoll}
          onUpdatePoll={handleUpdatePoll}
          onSwitchMode={() => setViewMode('consumer')}
          onLogout={handleLogout}
          onManageLabels={() => setViewMode('labels')}
          onPublishNow={handlePublishNow}
        />
      </>
    );
  }

  if (viewMode === 'labels' && user.isPublisher) {
    return (
      <>
        <GlobalAlertManager
          user={user}
          polls={polls}
          responses={responses}
          onSubmitResponse={handleSubmitResponse}
          onOpenPoll={(pollId) => {
            console.log('[App Label Mode] onOpenPoll called with pollId:', pollId);
            setOpenPollId(pollId);
            setViewMode('consumer');
          }}
        />
        <LabelManager
          onBack={() => setViewMode('publisher')}
          polls={polls}
          user={user}
        />
      </>
    );
  }

  return (
    <>
      <GlobalAlertManager
        user={user}
        polls={polls}
        responses={responses}
        onSubmitResponse={handleSubmitResponse}
        onOpenPoll={(pollId) => {
          console.log('[App] onOpenPoll called with pollId:', pollId);
          setOpenPollId(pollId);
        }}
      />
      <ConsumerDashboard
        user={user}
        polls={polls}
        responses={responses}
        onSubmitResponse={handleSubmitResponse}
        onSwitchMode={() => user.isPublisher && setViewMode('publisher')}
        onLogout={handleLogout}
        successMessage={successMessage}
        onClearMessage={() => setSuccessMessage(null)}
        openPollId={openPollId}
        onPollOpened={() => setOpenPollId(null)}
      />
    </>
  );
}

export default App;
