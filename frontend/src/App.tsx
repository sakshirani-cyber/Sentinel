import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePollData } from './hooks/usePollData';
import { Poll } from './types';

// Theme System
import { ThemeProvider } from './theme';

// Auth & Special Pages
import AuthPage from './components/AuthPage';
import PersistentAlertSecondary from './components/PersistentAlertSecondary';
import GlobalAlertManager from './components/GlobalAlertManager';

// New Ribbit Layout
import { 
  RibbitLayout, 
  CreateSignalPanel, 
  useLayout 
} from './components/layout';

// Page Components
import { 
  InboxPage, 
  SentPage, 
  LabelsPage, 
  GroupsPage, 
  SettingsPage 
} from './components/pages';

// Create Signal Wizard
import { CreateSignalWizard } from './components/wizard';

// Effects
import { ClickRipple } from './components/effects';

/**
 * Main App Content Component
 * Renders content based on current page from layout context
 */
function AppContent({
  user,
  polls,
  responses,
  onCreatePoll,
  onDeletePoll,
  onUpdatePoll,
  onSubmitResponse,
}: {
  user: any;
  polls: Poll[];
  responses: any[];
  onCreatePoll: (poll: Poll) => Promise<void>;
  onDeletePoll: (pollId: string) => void;
  onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
  onSubmitResponse: (response: any) => void;
}) {
  const { currentPage, closeCreatePanel } = useLayout();
  
  // Drafts for responses
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('sentinel_drafts');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('sentinel_drafts', JSON.stringify(drafts));
  }, [drafts]);

  const handleSaveDraft = (pollId: string, value: string) => {
    setDrafts(prev => ({ ...prev, [pollId]: value }));
  };

  // Handle response submission (now called inline from SignalRow)
  const handleSubmitResponse = async (pollId: string, value: string) => {
    const response = {
      pollId,
      consumerEmail: user.email,
      response: value,
      submittedAt: new Date().toISOString(),
      isDefault: false
    };
    await onSubmitResponse(response);
    // Clear draft after successful submission
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[pollId];
      return newDrafts;
    });
  };

  // Render page content based on currentPage
  const renderPageContent = () => {
    switch (currentPage) {
      case 'inbox':
        return (
          <InboxPage
            user={user}
            polls={polls}
            responses={responses}
            drafts={drafts}
            onSubmitResponse={handleSubmitResponse}
            onSaveDraft={handleSaveDraft}
          />
        );

      case 'sent':
        if (!user.isPublisher) return null;
        return (
          <SentPage
            user={user}
            polls={polls}
            responses={responses}
            onDeletePoll={onDeletePoll}
            onUpdatePoll={onUpdatePoll}
          />
        );

      case 'labels':
        if (!user.isPublisher) return null;
        return <LabelsPage user={user} polls={polls} />;

      case 'groups':
        if (!user.isPublisher) return null;
        return <GroupsPage />;

      case 'settings':
        return <SettingsPage user={user} />;

      default:
        return null;
    }
  };

  return (
    <>
      {/* Page Content */}
      {renderPageContent()}

      {/* Create Signal Sliding Panel */}
      <CreateSignalPanel>
        <CreateSignalWizard
          user={user}
          onCreatePoll={onCreatePoll}
          onClose={closeCreatePanel}
        />
      </CreateSignalPanel>
    </>
  );
}

/**
 * Main App Component
 */
function App() {
  const isSecondary = new URLSearchParams(window.location.search).get('isSecondary') === 'true';

  const { user, loginError, loginSuccess, login, logout } = useAuth();
  const { polls, responses, loading, createPoll, updatePoll, deletePoll, submitResponse } = usePollData();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // For notification click handling
  const [, setOpenPollId] = useState<string | null>(null);

  // If this is a secondary monitor window, render the lock-out view immediately
  if (isSecondary) {
    return (
      <ThemeProvider>
        <ClickRipple />
        <PersistentAlertSecondary />
      </ThemeProvider>
    );
  }

  // Handle poll creation with success message
  const handleCreatePoll = async (newPoll: Poll) => {
    const success = await createPoll(newPoll);
    if (success) {
      setSuccessMessage('Signal published successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Calculate counts for sidebar badges
  const counts = useMemo(() => {
    if (!user) return { inbox: 0, sent: 0 };
    
    const now = new Date();
    const userConsumerPolls = polls.filter(p =>
      p.status !== 'scheduled' &&
      p.consumers.some((c: string) => c.toLowerCase() === user.email.toLowerCase())
    );
    
    const incompleteCount = userConsumerPolls.filter(p => {
      const hasResponse = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
      const isExpired = p.status === 'completed' || new Date(p.deadline) < now;
      const isDeleted = p.status === 'deleted';
      return !hasResponse && !isExpired && !isDeleted;
    }).length;

    const sentCount = polls.filter(p => p.publisherEmail === user.email && p.status !== 'scheduled').length;

    return { inbox: incompleteCount, sent: sentCount };
  }, [polls, responses, user]);

  // Loading state
  if (loading) {
    return (
      <ThemeProvider>
        <ClickRipple />
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground-secondary font-medium">Loading Ribbit...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Auth page
  if (!user) {
    return (
      <ThemeProvider>
        <ClickRipple />
        <AuthPage onLogin={login} error={loginError} success={loginSuccess} />
      </ThemeProvider>
    );
  }

  // Main authenticated app with Ribbit Layout
  return (
    <ThemeProvider>
      {/* Global Click Ripple Effect */}
      <ClickRipple />

      {/* Global Alert Manager (handles notifications, persistent alerts) */}
      <GlobalAlertManager
        user={user}
        polls={polls}
        responses={responses}
        onSubmitResponse={submitResponse}
        onOpenPoll={(pollId) => {
          console.log('[App] onOpenPoll called with pollId:', pollId);
          setOpenPollId(pollId);
        }}
      />

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="ml-2 hover:opacity-80 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Layout */}
      <RibbitLayout
        user={user}
        counts={counts}
        onLogout={logout}
      >
        <AppContent
          user={user}
          polls={polls}
          responses={responses}
          onCreatePoll={handleCreatePoll}
          onDeletePoll={deletePoll}
          onUpdatePoll={updatePoll}
          onSubmitResponse={submitResponse}
        />
      </RibbitLayout>
    </ThemeProvider>
  );
}

export default App;
