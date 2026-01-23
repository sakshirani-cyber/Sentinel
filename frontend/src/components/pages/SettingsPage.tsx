import { User } from '../../types';
import { PageHeader } from '../layout';
import { User as UserIcon, Info, Shield, Bell, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SettingsPageProps {
  user: User;
}

/**
 * SettingsPage Component
 * 
 * User settings and preferences page.
 */
export default function SettingsPage({ user }: SettingsPageProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('ribbit-theme') as typeof theme | null;
    if (saved) setTheme(saved);
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="space-y-6 max-w-2xl">
        {/* Account Section */}
        <SettingsSection
          icon={UserIcon}
          title="Account"
          description="Your account information"
        >
          <div className="space-y-4">
            <SettingsRow label="Name" value={user.name} />
            <SettingsRow label="Email" value={user.email} />
            <SettingsRow
              label="Role"
              value={
                <span className={`font-medium ${user.isPublisher ? 'text-ribbit-fern' : ''}`}>
                  {user.isPublisher ? 'Publisher' : 'Consumer'}
                </span>
              }
            />
          </div>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection
          icon={theme === 'dark' ? Moon : Sun}
          title="Appearance"
          description="Customize how Ribbit looks"
        >
          <div className="flex items-center gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  localStorage.setItem('ribbit-theme', t);
                  // Apply theme
                  if (t === 'system') {
                    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', systemDark);
                  } else {
                    document.documentElement.classList.toggle('dark', t === 'dark');
                  }
                }}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  ${theme === t
                    ? 'bg-ribbit-hunter-green text-ribbit-dust-grey shadow-md'
                    : 'bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/30 text-ribbit-pine-teal dark:text-ribbit-dust-grey hover:bg-ribbit-dry-sage/50 dark:hover:bg-ribbit-hunter-green/50'
                  }
                `}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Configure notification preferences"
        >
          <div className="space-y-4">
            <ToggleRow
              label="Desktop Notifications"
              description="Show notifications for new signals"
              defaultEnabled={true}
            />
            <ToggleRow
              label="Sound Alerts"
              description="Play sound for urgent signals"
              defaultEnabled={true}
            />
            <ToggleRow
              label="Persistent Alerts"
              description="Keep alerts visible until acknowledged"
              defaultEnabled={false}
            />
          </div>
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection
          icon={Shield}
          title="Privacy"
          description="Privacy and data settings"
        >
          <p className="text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
            Your data is stored locally on this device. No personal information is shared with external services.
          </p>
        </SettingsSection>

        {/* About Section */}
        <SettingsSection
          icon={Info}
          title="About"
          description="App information"
        >
          <div className="space-y-3">
            <SettingsRow label="App Name" value="Ribbit" />
            <SettingsRow label="Version" value="1.0.0" />
            <SettingsRow label="Tagline" value="Signal with Nature's Clarity" />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

// Helper Components

interface SettingsSectionProps {
  icon: typeof UserIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <div className="bg-ribbit-dry-sage/40 dark:bg-ribbit-hunter-green/40 backdrop-blur-sm border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-ribbit-hunter-green/10 dark:bg-ribbit-fern/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
        </div>
        <div>
          <h3 className="font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage">
            {title}
          </h3>
          <p className="text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
            {description}
          </p>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

function SettingsRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-ribbit-fern/10 dark:border-ribbit-dry-sage/10 last:border-0">
      <span className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">{label}</span>
      <span className="font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey">{value}</span>
    </div>
  );
}

function ToggleRow({ 
  label, 
  description, 
  defaultEnabled 
}: { 
  label: string; 
  description: string; 
  defaultEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey">{label}</p>
        <p className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200
          ${enabled 
            ? 'bg-ribbit-hunter-green' 
            : 'bg-ribbit-dust-grey dark:bg-ribbit-pine-teal border border-ribbit-fern/30'
          }
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-md
            transition-transform duration-200
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}
