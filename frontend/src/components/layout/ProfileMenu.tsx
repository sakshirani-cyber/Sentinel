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
  const [dropdownStyle, setDropdownStyle] = useState<{ top?: number; left?: number; right?: number }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  // Calculate dropdown position - bottom-right of icon (aligns right edge)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const margin = 8; // Minimum margin from viewport edges
        const dropdownWidth = 256; // w-64 = 256px
        const viewportWidth = window.innerWidth;
        const topPos = buttonRect.bottom + 8;
        
        // Position dropdown so its right edge aligns with button's right edge
        let rightPos = viewportWidth - buttonRect.right;
        let leftPos: number | undefined = undefined;
        
        // If dropdown would overflow on the left, adjust to stay within viewport
        if (buttonRect.right - dropdownWidth < margin) {
          // Not enough space, position from left with margin
          leftPos = margin;
          rightPos = undefined;
        } else {
          // Enough space, align right edge of dropdown to right edge of button
          rightPos = viewportWidth - buttonRect.right;
          leftPos = undefined;
        }
        
        setDropdownStyle({ 
          top: topPos,
          left: leftPos,
          right: rightPos
        });
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    } else {
      setDropdownStyle({});
    }
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
        ref={buttonRef}
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

      {/* Dropdown - Fully opaque with proper positioning */}
      {isOpen && (
        <div 
          className="fixed w-64 max-w-[calc(100vw-1rem)] rounded-xl shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-border overflow-hidden z-50 animate-fade-in"
          style={{ 
            backgroundColor: 'var(--card-solid)',
            ...dropdownStyle
          }}
        >
          {/* User Info */}
          <div className="px-4 py-4 border-b border-border bg-muted dark:bg-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shadow-md">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-foreground-secondary truncate">
                  {user.email}
                </p>
              </div>
            </div>
            {/* Role Badge */}
            <div className="mt-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                user.isPublisher 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'bg-muted text-foreground-secondary border border-border'
              }`}>
                {user.isPublisher ? 'Publisher' : 'Consumer'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-all duration-200 hover:translate-x-1"
            >
              <Settings className="w-4 h-4 text-foreground-secondary" />
              Settings
            </button>
            
            <div className="h-px bg-border my-1 mx-4" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200 hover:translate-x-1"
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
