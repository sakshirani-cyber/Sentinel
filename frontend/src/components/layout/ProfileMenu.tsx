import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useLayout } from './LayoutContext';

interface ProfileMenuProps {
  user: {
    name: string;
    email: string;
    isPublisher: boolean;
  };
  onLogout: () => void;
}

/**
 * ProfileMenu Component
 * 
 * User avatar with dropdown menu for settings and logout.
 */
export default function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setCurrentPage } = useLayout();

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSettingsClick = () => {
    setCurrentPage('settings');
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-topbar-hover transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-ribbit-dry-sage flex items-center justify-center text-ribbit-pine-teal font-semibold text-sm shadow-md ring-2 ring-ribbit-dust-grey/30">
          {getInitials(user.name)}
        </div>
        
        {/* Name (hidden on mobile) */}
        <span className="hidden lg:block text-topbar-foreground text-sm font-medium max-w-[120px] truncate">
          {user.name}
        </span>
        
        <ChevronDown className={`hidden lg:block w-4 h-4 text-topbar-foreground/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-ribbit-dry-sage/90 backdrop-blur-md rounded-xl shadow-xl border border-ribbit-fern/30 overflow-hidden z-50 animate-fade-in">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-ribbit-fern/20 bg-ribbit-dry-sage/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ribbit-hunter-green flex items-center justify-center text-ribbit-dust-grey font-semibold shadow-md">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ribbit-hunter-green truncate">
                  {user.name}
                </p>
                <p className="text-xs text-ribbit-pine-teal/70 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            {/* Role Badge */}
            <div className="mt-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                user.isPublisher 
                  ? 'bg-ribbit-hunter-green/20 text-ribbit-hunter-green border border-ribbit-hunter-green/30' 
                  : 'bg-ribbit-fern/15 text-ribbit-fern border border-ribbit-fern/30'
              }`}>
                {user.isPublisher ? 'Publisher' : 'Consumer'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ribbit-pine-teal hover:bg-ribbit-hunter-green/10 transition-all duration-200 hover:translate-x-1"
            >
              <Settings className="w-4 h-4 text-ribbit-fern" />
              Settings
            </button>
            
            <div className="h-px bg-ribbit-fern/20 my-1 mx-4" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-500/10 transition-all duration-200 hover:translate-x-1"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
