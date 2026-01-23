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
 * Global header with:
 * - Logo and app name (left)
 * - Theme toggle, notifications, profile (right)
 * - Hamburger menu for mobile
 */
export default function Topbar({ user, incompleteCount = 0, onLogout }: TopbarProps) {
  const { toggleSidebar } = useLayout();

  return (
    <header className="ribbit-topbar">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-topbar-foreground/70 hover:text-topbar-foreground hover:bg-topbar-hover transition-all duration-200"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <RibbitLogo size={36} />
          <span className="text-topbar-foreground font-semibold text-lg hidden sm:block tracking-tight">
            Ribbit
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
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
