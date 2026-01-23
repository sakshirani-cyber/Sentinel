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
                <span className={`font-medium ${user.isPublisher ? 'text-primary' : ''}`}>
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
                  px-4 py-2.5 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${theme === t
                    ? 'bg-primary text-primary-foreground shadow-md dark:shadow-[0_0_15px_rgba(0,255,194,0.3)]'
                    : 'bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-border'
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
          <p className="text-sm text-foreground-secondary">
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
    <div className="bg-card dark:bg-card backdrop-blur-sm border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-primary/30">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-lg">
            {title}
          </h3>
          <p className="text-sm text-foreground-secondary">
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
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-foreground-secondary">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-all duration-200
          ${enabled 
            ? 'bg-primary dark:shadow-[0_0_10px_rgba(0,255,194,0.4)]' 
            : 'bg-muted'
          }
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200"
          style={{ transform: enabled ? 'translateX(1.25rem)' : 'translateX(0.125rem)' }}
        />
      </button>
    </div>
  );
}
