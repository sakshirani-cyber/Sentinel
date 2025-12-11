/// <reference path="./types/electron.d.ts" />
import { useState, useEffect } from 'react';
import PublisherDashboard from './components/PublisherDashboard';
import ConsumerDashboard from './components/ConsumerDashboard';
import NotificationDemo from './components/NotificationDemo';
import AuthPage from './components/AuthPage';

export interface User {
  email: string;
  name: string;
  isPublisher: boolean;
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  publisherEmail: string;
  publisherName: string;
  question: string;
  options: PollOption[];
  defaultResponse: string;
  showDefaultToConsumers: boolean;
  anonymityMode: 'anonymous' | 'record';
  deadline: string;
  isPersistentFinalAlert: boolean;
  consumers: string[];
  publishedAt: string;
  status: 'active' | 'completed';
  isEdited?: boolean;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'consumer' | 'publisher'>('consumer');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationPoll, setNotificationPoll] = useState<Poll | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize and load data
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data...');

      // Load User from LocalStorage (since we only migrated polls/responses to DB)
      const savedUser = localStorage.getItem('sentinel_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      if (window.electron?.db) {
        try {
          const savedPolls = await window.electron.db.getPolls();
          const savedResponses = await window.electron.db.getResponses();

          console.log('Loaded from SQLite DB:', { savedPolls, savedResponses });

          if (savedPolls && Array.isArray(savedPolls) && savedPolls.length > 0) {
            setPolls(savedPolls);
          } else {
            // If DB is empty, maybe we shouldn't initialize mock data automatically in production?
            // But for dev/demo, let's keep it empty or initialize if needed.
            // The user didn't ask to keep mock data.
            setPolls([]);
          }

          if (savedResponses) setResponses(savedResponses);
        } catch (error) {
          console.error('Error loading from SQLite DB:', error);
        }
      } else {
        // Fallback to localStorage if not in Electron (e.g. browser dev)
        const savedPolls = localStorage.getItem('sentinel_polls');
        const savedResponses = localStorage.getItem('sentinel_responses');

        if (savedPolls) setPolls(JSON.parse(savedPolls));
        if (savedResponses) setResponses(JSON.parse(savedResponses));
      }
      setIsLoaded(true);
    };

    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    if (currentUser) {
      localStorage.setItem('sentinel_user', JSON.stringify(currentUser));
    }
  }, [currentUser, isLoaded]);

  // Removed auto-sync for polls and responses as we now use explicit DB calls


  // Auto-apply default responses for missed deadlines
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      polls.forEach(poll => {
        if (poll.status === 'active' && new Date(poll.deadline) < now) {
          // Check for consumers who haven't responded
          poll.consumers.forEach(consumerEmail => {
            const hasResponded = responses.some(
              r => r.pollId === poll.id && r.consumerEmail === consumerEmail
            );
            if (!hasResponded) {
              // Add default response
              const defaultResponse: Response = {
                pollId: poll.id,
                consumerEmail,
                response: poll.defaultResponse,
                submittedAt: poll.deadline,
                isDefault: true
              };
              setResponses((prev: Response[]) => [...prev, defaultResponse]);
            }
          });
          // Mark poll as completed
          setPolls((prev: Poll[]) => prev.map(p =>
            p.id === poll.id ? { ...p, status: 'completed' as const } : p
          ));
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [polls, responses]);

  const handleLogin = (email: string, password: string) => {
    // Mock authentication - in real app, this would validate against backend
    // Publishers are those with specific email domains or in publisher list
    const publisherEmails = [
      'hr@company.com',
      'it@company.com',
      'admin@company.com',
      'operations@company.com',
      'manager@company.com'
    ];

    const isPublisher = publisherEmails.includes(email.toLowerCase());

    const user: User = {
      email,
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      isPublisher
    };
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMode('consumer');
    localStorage.removeItem('sentinel_user');
  };

  const handleCreatePoll = async (poll: Poll) => {
    setPolls((prev: Poll[]) => [...prev, poll]);

    if (window.electron?.db) {
      try {
        await window.electron.db.createPoll(poll);
      } catch (error) {
        console.error('Failed to create poll in DB:', error);
        // Optionally revert state or show error
      }
    } else {
      // Fallback for browser dev
      const currentPolls = JSON.parse(localStorage.getItem('sentinel_polls') || '[]');
      localStorage.setItem('sentinel_polls', JSON.stringify([...currentPolls, poll]));
    }

    // Show notification demo only if the current user is a targeted consumer
    if (currentUser && poll.consumers.includes(currentUser.email)) {
      setNotificationPoll(poll);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleSubmitResponse = async (response: Response) => {
    setResponses((prev: Response[]) => [...prev, response]);

    if (window.electron?.db) {
      try {
        await window.electron.db.submitResponse(response);
      } catch (error) {
        console.error('Failed to submit response to DB:', error);
      }
    } else {
      const currentResponses = JSON.parse(localStorage.getItem('sentinel_responses') || '[]');
      localStorage.setItem('sentinel_responses', JSON.stringify([...currentResponses, response]));
    }
  };

  const handleDeletePoll = (pollId: string) => {
    setPolls((prev: Poll[]) => prev.filter(p => p.id !== pollId));
  };

  const handleUpdatePoll = (pollId: string, updates: Partial<Poll>) => {
    setPolls((prev: Poll[]) => prev.map(p => p.id === pollId ? { ...p, ...updates } : p));
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-mono-bg">
      {showNotification && notificationPoll && (
        <NotificationDemo
          poll={notificationPoll}
          onClose={() => setShowNotification(false)}
          onFill={() => {
            setShowNotification(false);
            setMode('consumer');
          }}
        />
      )}

      {mode === 'publisher' ? (
        <PublisherDashboard
          user={currentUser}
          polls={polls}
          responses={responses}
          onCreatePoll={handleCreatePoll}
          onDeletePoll={handleDeletePoll}
          onUpdatePoll={handleUpdatePoll}
          onSwitchMode={() => setMode('consumer')}
          onLogout={handleLogout}
        />
      ) : (
        <ConsumerDashboard
          user={currentUser}
          polls={polls}
          responses={responses}
          onSubmitResponse={handleSubmitResponse}
          onSwitchMode={() => setMode('publisher')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;