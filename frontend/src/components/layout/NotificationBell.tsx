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
  const [dropdownStyle, setDropdownStyle] = useState<{ top?: number; left?: number; right?: number }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        const dropdownWidth = 320; // w-80 = 320px
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
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

      {/* Dropdown - Fully opaque with proper positioning */}
      {isOpen && (
        <div 
          className="fixed w-80 max-w-[calc(100vw-1rem)] rounded-xl shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-border overflow-hidden z-50 animate-fade-in"
          style={{ 
            backgroundColor: 'var(--card-solid)',
            ...dropdownStyle
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted dark:bg-secondary">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {count > 0 && (
              <button className="text-xs text-foreground-secondary hover:text-foreground transition-colors font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-muted dark:bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-foreground" />
                </div>
                <p className="text-sm text-foreground-secondary">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="py-2">
                {/* Placeholder for notifications - will be populated later */}
                <div className="px-4 py-3 hover:bg-muted dark:hover:bg-secondary cursor-pointer transition-all duration-200">
                  <p className="text-sm font-medium text-foreground">
                    {count} pending signal{count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-foreground-secondary mt-1">
                    You have signals waiting for your response
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted dark:bg-secondary">
            <button 
              className="w-full text-center text-sm text-foreground-secondary hover:text-foreground transition-colors font-medium hover:underline"
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
