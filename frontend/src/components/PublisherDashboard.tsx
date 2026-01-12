import { useState } from 'react';
import { User, Poll, Response } from '../App';
import { PlusCircle, List, LogOut, Settings, Tag, CalendarClock } from 'lucide-react';
import logo from '../assets/logo.png';
import CreatePoll from './CreatePoll';
import PublishedPolls from './PublishedPolls';
import ScheduledPolls from './ScheduledPolls';
import FormTypeSelector from './FormTypeSelector';

interface PublisherDashboardProps {
  user: User;
  polls: Poll[];
  responses: Response[];
  onCreatePoll: (poll: Poll) => void;
  onDeletePoll: (pollId: string) => void;
  onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
  onSwitchMode: () => void;
  onLogout: () => void;
  onManageLabels: () => void;
  onPublishNow?: (poll: Poll) => void;
}

export default function PublisherDashboard({
  user,
  polls,
  responses,
  onCreatePoll,
  onDeletePoll,
  onUpdatePoll,
  onSwitchMode,
  onLogout,
  onManageLabels,
  onPublishNow
}: PublisherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'published' | 'scheduled'>('published');
  const [selectedFormType, setSelectedFormType] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const userPolls = polls.filter(p => p.publisherEmail === user.email);
  const activePolls = userPolls.filter(p => p.status !== 'scheduled');
  const scheduledPolls = polls.filter(p => p.status === 'scheduled');

  const handleFormTypeSelect = (formType: string) => {
    setSelectedFormType(formType);
  };

  const handleBackToSelection = () => {
    setSelectedFormType(null);
  };

  return (
    <div className="min-h-screen bg-mono-bg">
      {/* Header */}
      <header className="bg-mono-primary border-b border-mono-primary sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-mono-accent rounded-xl flex items-center justify-center shadow-xl overflow-hidden">
                <img src={logo} alt="Sentinel Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-mono-bg">Sentinel</h1>
                <p className="text-sm text-mono-bg/70">Publisher Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right mr-4 px-4 py-2 bg-mono-bg/10 backdrop-blur rounded-xl border border-mono-bg/20">
                <p className="text-sm text-mono-bg">{user.name}</p>
                <p className="text-xs text-mono-bg/70">{user.email}</p>
              </div>

              <button
                onClick={onSwitchMode}
                className="flex items-center gap-2 px-4 py-2.5 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg"
              >
                <span className="hidden sm:inline">Switch to Consumer</span>
              </button>

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
                          setShowSettings(false);
                          onManageLabels();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-mono-bg hover:bg-mono-accent/10 flex items-center gap-2 transition-colors"
                      >
                        <Tag className="w-4 h-4" />
                        Label
                      </button>
                      <div className="h-px bg-mono-bg/10 my-1" />
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

      {/* Navigation Tabs */}
      <div className="bg-mono-primary/5 border-b border-mono-primary/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('create');
                setSelectedFormType(null);
              }}
              className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-all rounded-t-xl ${activeTab === 'create'
                ? 'border-b-mono-accent text-mono-primary bg-mono-accent/10'
                : 'border-transparent text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/5'
                }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Create</span>
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-all rounded-t-xl ${activeTab === 'scheduled'
                ? 'border-b-mono-accent text-mono-primary bg-mono-accent/10'
                : 'border-transparent text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/5'
                }`}
            >
              <CalendarClock className="w-5 h-5" />
              <span className="hidden sm:inline">Scheduled</span>
              {scheduledPolls.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${activeTab === 'scheduled'
                  ? 'bg-mono-accent/30 text-mono-primary'
                  : 'bg-mono-primary/20 text-mono-primary'
                  }`}>
                  {scheduledPolls.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-all rounded-t-xl ${activeTab === 'published'
                ? 'border-b-mono-accent text-mono-primary bg-mono-accent/10'
                : 'border-transparent text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/5'
                }`}
            >
              <List className="w-5 h-5" />
              <span className="hidden sm:inline">Published</span>
              {activePolls.length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${activeTab === 'published'
                  ? 'bg-mono-accent/30 text-mono-primary'
                  : 'bg-mono-primary/20 text-mono-primary'
                  }`}>
                  {activePolls.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {activeTab === 'create' && (
          <>
            {!selectedFormType ? (
              <FormTypeSelector onSelectFormType={handleFormTypeSelect} />
            ) : (
              <div>
                <button
                  onClick={handleBackToSelection}
                  className="mb-6 px-4 py-2 text-mono-text/70 hover:text-mono-text hover:bg-mono-primary/5 rounded-xl transition-colors"
                >
                  ← Back to form types
                </button>
                <CreatePoll
                  user={user}
                  onCreatePoll={async (poll) => {
                    await onCreatePoll(poll);
                    setActiveTab(poll.status === 'scheduled' ? 'scheduled' : 'published');
                  }}
                  existingPolls={polls}
                  formType={selectedFormType}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'published' && (
          <PublishedPolls
            polls={activePolls}
            responses={responses}
            onDeletePoll={onDeletePoll}
            onUpdatePoll={onUpdatePoll}
          />
        )}

        {activeTab === 'scheduled' && (
          <ScheduledPolls
            polls={scheduledPolls}
            onDeletePoll={onDeletePoll}
            onUpdatePoll={onUpdatePoll}
            onPublishNow={(poll) => onPublishNow?.(poll)}
          />
        )}
      </main>
    </div>
  );
}