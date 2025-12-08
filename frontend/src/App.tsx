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
    const initializeMockData = () => {
      const mockPolls: Poll[] = [
        {
          id: 'poll-1701234567890-abc123',
          publisherEmail: 'hr@company.com',
          publisherName: 'Sarah Chen (HR)',
          question: 'Are you available for the team offsite next Friday?',
          options: [
            { id: 'opt-0', text: 'Yes, I can attend' },
            { id: 'opt-1', text: 'No, I have conflicts' },
            { id: 'opt-2', text: 'Maybe, need to check' }
          ],
          defaultResponse: 'No response provided',
          showDefaultToConsumers: true,
          anonymityMode: 'record',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          isPersistentFinalAlert: true,
          consumers: ['alice@company.com', 'bob@company.com', 'charlie@company.com', 'diana@company.com', 'eve@company.com'],
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          status: 'active'
        },
        {
          id: 'poll-1701234567891-def456',
          publisherEmail: 'it@company.com',
          publisherName: 'Michael Torres (IT)',
          question: 'Which time slot works best for system maintenance this weekend?',
          options: [
            { id: 'opt-0', text: 'Saturday 2AM - 6AM' },
            { id: 'opt-1', text: 'Sunday 2AM - 6AM' },
            { id: 'opt-2', text: 'Either works for me' }
          ],
          defaultResponse: 'Either works for me',
          showDefaultToConsumers: false,
          anonymityMode: 'anonymous',
          deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
          isPersistentFinalAlert: false,
          consumers: ['alice@company.com', 'bob@company.com', 'charlie@company.com'],
          publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          status: 'active'
        },
        {
          id: 'poll-1701234567892-ghi789',
          publisherEmail: 'admin@company.com',
          publisherName: 'Jennifer Kim (Admin)',
          question: 'Did you complete the mandatory security training?',
          options: [
            { id: 'opt-0', text: 'Yes, completed' },
            { id: 'opt-1', text: 'No, not yet' }
          ],
          defaultResponse: 'No, not yet',
          showDefaultToConsumers: true,
          anonymityMode: 'record',
          deadline: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago (expired)
          isPersistentFinalAlert: true,
          consumers: ['alice@company.com', 'bob@company.com', 'charlie@company.com', 'diana@company.com', 'eve@company.com'],
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          status: 'completed'
        },
        {
          id: 'poll-1701234567893-jkl012',
          publisherEmail: 'operations@company.com',
          publisherName: 'David Park (Operations)',
          question: 'What is your preferred lunch option for the all-hands meeting?',
          options: [
            { id: 'opt-0', text: 'Vegetarian' },
            { id: 'opt-1', text: 'Non-vegetarian' },
            { id: 'opt-2', text: 'Vegan' }
          ],
          defaultResponse: 'Vegetarian',
          showDefaultToConsumers: true,
          anonymityMode: 'record',
          deadline: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
          isPersistentFinalAlert: true,
          consumers: ['alice@company.com', 'bob@company.com', 'charlie@company.com', 'diana@company.com'],
          publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          status: 'active'
        }
      ];

      const mockResponses: Response[] = [
        {
          pollId: 'poll-1701234567892-ghi789',
          consumerEmail: 'alice@company.com',
          response: 'Yes, completed',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isDefault: false
        },
        {
          pollId: 'poll-1701234567892-ghi789',
          consumerEmail: 'bob@company.com',
          response: 'No, not yet',
          submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          isDefault: true
        }
      ];

      if (window.electron?.store) {
        window.electron.store.set('sentinel_polls', mockPolls);
        window.electron.store.set('sentinel_responses', mockResponses);
      } else {
        localStorage.setItem('sentinel_polls', JSON.stringify(mockPolls));
        localStorage.setItem('sentinel_responses', JSON.stringify(mockResponses));
      }
      setPolls(mockPolls);
      setResponses(mockResponses);
    };

    const loadData = async () => {
      console.log('Loading data...', { hasElectronStore: !!window.electron?.store });
      if (window.electron?.store) {
        try {
          const savedUser = await window.electron.store.get('sentinel_user');
          const savedPolls = await window.electron.store.get('sentinel_polls');
          const savedResponses = await window.electron.store.get('sentinel_responses');

          console.log('Loaded from Electron Store:', { savedUser, savedPolls, savedResponses });

          if (savedUser) setCurrentUser(savedUser);

          if (savedPolls && Array.isArray(savedPolls) && savedPolls.length > 0) {
            setPolls(savedPolls);
          } else {
            initializeMockData();
          }

          if (savedResponses) setResponses(savedResponses);
        } catch (error) {
          console.error('Error loading from Electron Store:', error);
        }
      } else {
        const savedUser = localStorage.getItem('sentinel_user');
        const savedPolls = localStorage.getItem('sentinel_polls');
        const savedResponses = localStorage.getItem('sentinel_responses');

        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        if (savedPolls) setPolls(JSON.parse(savedPolls));
        else initializeMockData();
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
      if (window.electron?.store) {
        window.electron.store.set('sentinel_user', currentUser);
      } else {
        localStorage.setItem('sentinel_user', JSON.stringify(currentUser));
      }
    }
  }, [currentUser, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (window.electron?.store) {
      window.electron.store.set('sentinel_polls', polls);
    } else {
      localStorage.setItem('sentinel_polls', JSON.stringify(polls));
    }
  }, [polls, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (window.electron?.store) {
      window.electron.store.set('sentinel_responses', responses);
    } else {
      localStorage.setItem('sentinel_responses', JSON.stringify(responses));
    }
  }, [responses, isLoaded]);

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

  const handleCreatePoll = (poll: Poll) => {
    setPolls((prev: Poll[]) => [...prev, poll]);

    // Show notification demo only if the current user is a targeted consumer
    if (currentUser && poll.consumers.includes(currentUser.email)) {
      setNotificationPoll(poll);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleSubmitResponse = (response: Response) => {
    setResponses((prev: Response[]) => [...prev, response]);
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