import { useState } from 'react';
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
 * - Logo transforms to app name on hover
 */
export default function Topbar({ user, incompleteCount = 0, onLogout }: TopbarProps) {
  const { toggleSidebar } = useLayout();
  const [isLogoHovered, setIsLogoHovered] = useState(false);

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

        {/* Logo - transforms to show app name on hover */}
        <div 
          className="relative flex items-center cursor-pointer overflow-hidden"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
        >
          {/* Logo container with transform */}
          <div className={`
            flex items-center gap-3
            transition-all duration-500 ease-out
            ${isLogoHovered ? 'opacity-0 scale-75 -translate-x-2' : 'opacity-100 scale-100 translate-x-0'}
          `}>
            <RibbitLogo size={36} variant="animated" />
          </div>
          
          {/* App name that appears on hover */}
          <div className={`
            absolute inset-0 flex items-center
            transition-all duration-500 ease-out
            ${isLogoHovered 
              ? 'opacity-100 translate-x-0 scale-100' 
              : 'opacity-0 translate-x-4 scale-90 pointer-events-none'
            }
          `}>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap">
              Ribbit
            </span>
          </div>
        </div>
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
