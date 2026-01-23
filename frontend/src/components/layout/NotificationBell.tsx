import { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
}

/**
 * NotificationBell Component
 * 
 * Shows notification count badge and dropdown with recent notifications.
 */
export default function NotificationBell({ count = 0 }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-topbar-foreground/70 hover:text-topbar-foreground hover:bg-topbar-hover transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className={`w-5 h-5 transition-transform duration-200 ${count > 0 ? 'animate-pulse' : ''}`} />
        
        {/* Badge */}
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold shadow-lg animate-pulse">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown - Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-ribbit-dry-sage/90 backdrop-blur-md rounded-xl shadow-xl border border-ribbit-fern/30 overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ribbit-fern/20 bg-ribbit-dry-sage/50">
            <h3 className="font-semibold text-ribbit-hunter-green">Notifications</h3>
            {count > 0 && (
              <button className="text-xs text-ribbit-fern hover:text-ribbit-hunter-green transition-colors font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-ribbit-fern/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-ribbit-hunter-green" />
                </div>
                <p className="text-sm text-ribbit-pine-teal/70">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="py-2">
                {/* Placeholder for notifications - will be populated later */}
                <div className="px-4 py-3 hover:bg-ribbit-hunter-green/10 cursor-pointer transition-all duration-200">
                  <p className="text-sm font-medium text-ribbit-hunter-green">
                    {count} pending signal{count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-ribbit-pine-teal/70 mt-1">
                    You have signals waiting for your response
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-ribbit-fern/20 bg-ribbit-dry-sage/50">
            <button 
              className="w-full text-center text-sm text-ribbit-fern hover:text-ribbit-hunter-green transition-colors font-medium hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
