import { Menu } from 'lucide-react';
import { useLayout } from './LayoutContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';
import RibbitLogo from '../RibbitLogo';

interface TopbarProps {
  user: {
    name: string;
    email: string;
    isPublisher: boolean;
  };
  incompleteCount?: number;
  onLogout: () => void;
}

/**
 * Topbar Component
 * 
 * Award-winning floating header with:
 * - Transparent glassmorphism background
 * - Neon Marsh color palette
 * - Premium micro-interactions
 * - Smooth theme transitions
 * - Logo waves morph into "Ribbit" text on hover
 */
export default function Topbar({ user, incompleteCount = 0, onLogout }: TopbarProps) {
  const { toggleSidebar } = useLayout();

  return (
    <header className="ribbit-topbar">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2.5 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-primary/10 dark:hover:bg-primary/15 transition-all duration-200 active:scale-95"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo - morphs to show app name "Ribbit" on hover */}
        <RibbitLogo size={36} variant="animated" morphToText />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell count={incompleteCount} />

        {/* Profile Menu */}
        <ProfileMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
