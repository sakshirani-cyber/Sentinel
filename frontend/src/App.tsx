import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePollData } from './hooks/usePollData';
import { Poll } from './types';
import AuthPage from './components/AuthPage';
import PublisherDashboard from './components/PublisherDashboard';
import ConsumerDashboard from './components/ConsumerDashboard';
import GlobalAlertManager from './components/GlobalAlertManager';
import LabelManager from './components/LabelManager';
import PersistentAlertSecondary from './components/PersistentAlertSecondary';

function App() {
  const isSecondary = new URLSearchParams(window.location.search).get('isSecondary') === 'true';

  const { user, loginError, loginSuccess, login, logout } = useAuth();
  const { polls, responses, loading, createPoll, updatePoll, deletePoll, submitResponse } = usePollData();

  const [viewMode, setViewMode] = useState<'consumer' | 'publisher' | 'labels'>('consumer');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openPollId, setOpenPollId] = useState<string | null>(null);

  // If this is a secondary monitor window, render the lock-out view immediately
  if (isSecondary) {
    return <PersistentAlertSecondary />;
  }

  useEffect(() => {
    if (user) {
      setViewMode(user.isPublisher ? 'publisher' : 'consumer');
    }
  }, [user]);

  const handleCreatePollWrapper = async (newPoll: Poll) => {
    const success = await createPoll(newPoll);
    if (success) {
      // Redirect to publisher view with success message
      setViewMode('publisher');
      setSuccessMessage('Poll published successfully!');

      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
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
    return <AuthPage onLogin={login} error={loginError} success={loginSuccess} />;
  }

  if (viewMode === 'publisher' && user.isPublisher) {
    return (
      <>
        <GlobalAlertManager
          user={user}
          polls={polls}
          responses={responses}
          onSubmitResponse={submitResponse}
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
          onCreatePoll={handleCreatePollWrapper}
          onDeletePoll={deletePoll}
          onUpdatePoll={updatePoll}
          onSwitchMode={() => setViewMode('consumer')}
          onLogout={logout}
          onManageLabels={() => setViewMode('labels')}
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
          onSubmitResponse={submitResponse}
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
        onSubmitResponse={submitResponse}
        onOpenPoll={(pollId) => {
          console.log('[App] onOpenPoll called with pollId:', pollId);
          setOpenPollId(pollId);
        }}
      />
      <ConsumerDashboard
        user={user}
        polls={polls}
        responses={responses}
        onSubmitResponse={submitResponse}
        onSwitchMode={() => user.isPublisher && setViewMode('publisher')}
        onLogout={logout}
        successMessage={successMessage}
        onClearMessage={() => setSuccessMessage(null)}
        openPollId={openPollId}
        onPollOpened={() => setOpenPollId(null)}
      />
    </>
  );
}

export default App;
