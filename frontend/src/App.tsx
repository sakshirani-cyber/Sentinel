import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import PublisherDashboard from './components/PublisherDashboard';
import ConsumerDashboard from './components/ConsumerDashboard';

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
  status: 'active' | 'completed';
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
}

export interface Response {
  pollId: string;
  consumerEmail: string;
  response: string;
  submittedAt: string;
  isDefault: boolean;
  skipReason?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  // We need a view mode state to allow publishers to switch to consumer view
  const [viewMode, setViewMode] = useState<'publisher' | 'consumer'>('publisher');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if ((window as any).electron) {
          const loadedPolls = await (window as any).electron.db.getPolls();
          const loadedResponses = await (window as any).electron.db.getResponses();
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
    try {
      if ((window as any).electron?.backend) {
        console.log('[Frontend] Attempting login via backend:', email);
        const result = await (window as any).electron.backend.login(email, password);

        if (result.success) {
          console.log('[Frontend] Login successful, role:', result.data);
          const role = result.data; // "PUBLISHER" or "CONSUMER"
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
          alert('Login failed: ' + result.error);
        }
      } else {
        // Fallback for dev without electron (shouldn't happen in prod)
        console.warn('[Frontend] Backend API not available, using mock login');
        const isPublisher = email.toLowerCase().startsWith('hr') || email.toLowerCase().includes('admin');
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
      alert('Login error occurred');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleCreatePoll = async (newPoll: Poll) => {
    try {
      // Try to create on backend first via Electron IPC (bypasses CORS)
      if ((window as any).electron?.backend) {
        console.log('[Frontend] Calling backend to create poll:', newPoll.question);
        try {
          const backendResult = await (window as any).electron.backend.createPoll(newPoll);
          console.log('[Frontend] Backend create poll result:', backendResult);

          if (backendResult.success) {
            newPoll.cloudSignalId = backendResult.data.cloudSignalId;
            newPoll.syncStatus = 'synced';
            console.log('[Frontend] Poll synced to backend, cloudSignalId:', newPoll.cloudSignalId);
          } else {
            console.warn('[Frontend] Failed to create poll on backend:', backendResult.error);
            newPoll.syncStatus = 'error';
          }
        } catch (backendError) {
          console.warn('[Frontend] Backend error:', backendError);
          newPoll.syncStatus = 'error';
        }
      } else {
        console.warn('[Frontend] Backend API not available (electron.backend missing)');
      }

      // Always save to local DB
      if ((window as any).electron) {
        const result = await (window as any).electron.db.createPoll(newPoll);
        if (result.success) {
          setPolls(prev => [...prev, newPoll]);
        } else {
          console.error('Failed to create poll locally:', result.error);
          alert('Failed to create poll: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll: ' + (error as Error).message);
    }
  };

  const handleUpdatePoll = async (pollId: string, updates: Partial<Poll>, republish: boolean) => {
    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) throw new Error('Poll not found');

      const updatedPoll = { ...poll, ...updates };

      // Try to update on backend if synced via Electron IPC
      if (poll.cloudSignalId && (window as any).electron?.backend) {
        try {
          const backendResult = await (window as any).electron.backend.editPoll(
            poll.cloudSignalId,
            updatedPoll,
            republish
          );
          if (backendResult.success) {
            updates.syncStatus = 'synced';
          } else {
            console.warn('Failed to update poll on backend:', backendResult.error);
            updates.syncStatus = 'error';
          }
        } catch (backendError) {
          console.warn('Failed to update poll on backend:', backendError);
          updates.syncStatus = 'error';
        }
      }

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

      // Try to delete from backend if synced
      if (poll.cloudSignalId && (window as any).electron?.backend) {
        console.log('[Frontend] Calling backend to delete poll:', { pollId, cloudSignalId: poll.cloudSignalId });
        try {
          const backendResult = await (window as any).electron.backend.deletePoll(poll.cloudSignalId);
          console.log('[Frontend] Backend delete poll result:', backendResult);

          if (!backendResult.success) {
            console.warn('[Frontend] Failed to delete poll from backend:', backendResult.error);
            // Continue with local delete even if backend fails
          } else {
            console.log('[Frontend] Poll deleted from backend successfully');
          }
        } catch (backendError) {
          console.warn('[Frontend] Backend error during delete:', backendError);
          // Continue with local delete even if backend fails
        }
      } else {
        console.log('[Frontend] Skipping backend delete - poll not synced or backend unavailable');
      }

      // Always delete from local state
      setPolls(prev => prev.filter(p => p.id !== pollId));
      console.log('[Frontend] Poll deleted from local state:', pollId);

      // Delete from local DB via Electron IPC
      if ((window as any).electron) {
        try {
          console.log('[Frontend] Deleting from local DB:', pollId);
          const result = await (window as any).electron.db.deletePoll(pollId);
          if (result.success) {
            console.log('[Frontend] Poll deleted from local DB successfully');
          } else {
            console.error('[Frontend] Failed to delete poll from local DB:', result.error);
          }
        } catch (error) {
          console.error('[Frontend] Error deleting from local DB:', error);
        }
      }

    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Error deleting poll: ' + (error as Error).message);
    }
  };

  const handleSubmitResponse = async (response: Response) => {
    try {
      const poll = polls.find(p => p.id === response.pollId);
      if (!poll) throw new Error('Poll not found');

      // Try to submit to backend if poll is synced via Electron IPC
      if (poll.cloudSignalId && (window as any).electron?.backend) {
        console.log('[Frontend] Calling backend to submit vote:', { cloudSignalId: poll.cloudSignalId, userId: response.consumerEmail, option: response.response });
        try {
          const backendResult = await (window as any).electron.backend.submitVote(
            poll.cloudSignalId,
            response.consumerEmail,
            response.response
          );
          console.log('[Frontend] Backend submit vote result:', backendResult);

          if (!backendResult.success) {
            console.warn('[Frontend] Failed to submit vote to backend:', backendResult.error);
          } else {
            console.log('[Frontend] Vote synced to backend');
          }
        } catch (backendError) {
          console.warn('[Frontend] Backend error:', backendError);
        }
      } else {
        console.log('[Frontend] Skipping backend vote - poll not synced or backend unavailable');
      }

      // Always save to local DB
      if ((window as any).electron) {
        const result = await (window as any).electron.db.submitResponse(response);
        if (result.success) {
          setResponses(prev => [...prev, response]);
        } else {
          console.error('Failed to submit response:', result.error);
          alert('Failed to submit response: ' + result.error);
        }
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
    return <AuthPage onLogin={handleLogin} />;
  }

  if (viewMode === 'publisher' && user.isPublisher) {
    return (
      <PublisherDashboard
        user={user}
        polls={polls}
        responses={responses}
        onCreatePoll={handleCreatePoll}
        onDeletePoll={handleDeletePoll}
        onUpdatePoll={handleUpdatePoll}
        onSwitchMode={() => setViewMode('consumer')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ConsumerDashboard
      user={user}
      polls={polls}
      responses={responses}
      onSubmitResponse={handleSubmitResponse}
      onSwitchMode={() => user.isPublisher && setViewMode('publisher')}
      onLogout={handleLogout}
    />
  );
}

export default App;
